"""Firestore data access layer — async wrapper used in place of Motor.

The wrapper exposes the small subset of Mongo-like operations the app uses,
mapping them to google-cloud-firestore AsyncClient calls.
"""
import os
import asyncio
import re as _re
from typing import Optional

from google.cloud import firestore
from google.cloud.firestore import AsyncClient, FieldFilter


_client: Optional[AsyncClient] = None


def get_client() -> AsyncClient:
    global _client
    if _client is None:
        # Uses GOOGLE_APPLICATION_CREDENTIALS env var
        _client = AsyncClient(project=os.environ.get("FIREBASE_PROJECT_ID"))
    return _client


# --- Query operator translation ---
def _apply_filter(query, field: str, condition):
    """Translate a Mongo-style condition into Firestore where()."""
    if isinstance(condition, dict):
        if "$regex" in condition:
            # Firestore has no regex. Emulate caller-side by streaming and filtering
            return ("REGEX", field, condition["$regex"], condition.get("$options", ""))
        if "$in" in condition:
            return query.where(filter=FieldFilter(field, "in", list(condition["$in"])))
        if "$gte" in condition or "$lte" in condition or "$gt" in condition or "$lt" in condition:
            for op_key, fop in (("$gte", ">="), ("$lte", "<="), ("$gt", ">"), ("$lt", "<")):
                if op_key in condition:
                    query = query.where(filter=FieldFilter(field, fop, condition[op_key]))
            return query
        if "$ne" in condition:
            return ("NE", field, condition["$ne"], query)
        if "$exists" in condition:
            # Cannot express exists in Firestore directly — filter post-fetch
            return ("EXISTS", field, condition["$exists"], query)
    # Array fields (e.g. medidas_tags) use array_contains for scalar match
    if field in ("medidas_tags", "adaptacoes_avaliacao") and not isinstance(condition, list):
        return query.where(filter=FieldFilter(field, "array_contains", condition))
    return query.where(filter=FieldFilter(field, "==", condition))


def _build_query(coll_ref, mongo_query: dict):
    """Returns (firestore_query, post_filters) where post_filters are applied client-side."""
    q = coll_ref
    post_filters = []
    or_conditions = mongo_query.get("$or")
    for k, v in mongo_query.items():
        if k == "$or":
            continue
        applied = _apply_filter(q, k, v)
        if isinstance(applied, tuple):
            post_filters.append(applied)
        else:
            q = applied
    if or_conditions:
        post_filters.append(("OR", or_conditions))
    return q, post_filters


def _matches_post(doc_dict: dict, post_filters: list) -> bool:
    for f in post_filters:
        if f[0] == "REGEX":
            _, field, pattern, opts = f
            flags = _re.IGNORECASE if "i" in opts else 0
            val = doc_dict.get(field, "")
            if not isinstance(val, str) or not _re.search(pattern, val, flags=flags):
                return False
        elif f[0] == "NE":
            _, field, ne_value, _q = f
            if doc_dict.get(field) == ne_value:
                return False
        elif f[0] == "EXISTS":
            _, field, must_exist, _q = f
            has = field in doc_dict and doc_dict[field] is not None
            if must_exist and not has:
                return False
            if not must_exist and has:
                return False
        elif f[0] == "OR":
            _, or_list = f
            ok = False
            for sub in or_list:
                if all(_field_matches(doc_dict, k, v) for k, v in sub.items()):
                    ok = True
                    break
            if not ok:
                return False
    return True


def _field_matches(doc_dict, field, condition):
    val = doc_dict.get(field)
    if isinstance(condition, dict):
        if "$exists" in condition:
            has = field in doc_dict and doc_dict[field] is not None
            return has == bool(condition["$exists"])
        if "$ne" in condition:
            return val != condition["$ne"]
    return val == condition


class _Cursor:
    def __init__(self, coll, query, post_filters, projection=None):
        self._coll = coll
        self._q = query
        self._post = post_filters
        self._projection = projection or {}
        self._sort_field = None
        self._sort_dir = 1

    def sort(self, field, direction=1):
        # Defer sorting until to_list (because we may have post-filters)
        self._sort_field = field
        self._sort_dir = direction
        return self

    async def to_list(self, length=None):
        # If there are post-filters, fetch all and filter in Python
        results = []
        if self._post:
            stream_q = self._q
        else:
            stream_q = self._q
        try:
            async for snap in stream_q.stream():
                d = snap.to_dict() or {}
                if self._post and not _matches_post(d, self._post):
                    continue
                results.append(_project(d, self._projection))
                if length and not self._sort_field and len(results) >= length and not self._post:
                    break
        except Exception:
            raise
        if self._sort_field:
            results.sort(
                key=lambda r: (r.get(self._sort_field) is None, r.get(self._sort_field) or ""),
                reverse=(self._sort_dir == -1),
            )
        if length:
            return results[:length]
        return results


def _project(doc: dict, projection: dict) -> dict:
    if not projection:
        return doc
    # Exclude mode (any value == 0)
    excludes = [k for k, v in projection.items() if v == 0]
    if excludes:
        return {k: v for k, v in doc.items() if k not in excludes}
    # Include mode (any value == 1)
    includes = [k for k, v in projection.items() if v == 1]
    if includes:
        return {k: v for k, v in doc.items() if k in includes}
    return doc


class Collection:
    def __init__(self, name: str):
        self.name = name

    def _ref(self):
        return get_client().collection(self.name)

    def _doc_ref(self, doc_id: str):
        return get_client().collection(self.name).document(doc_id)

    # ---- find / find_one ----
    def find(self, query: Optional[dict] = None, projection: Optional[dict] = None):
        query = query or {}
        q, post = _build_query(self._ref(), query)
        return _Cursor(self, q, post, projection)

    async def find_one(self, query: Optional[dict] = None, projection: Optional[dict] = None):
        query = query or {}
        # Fast path: lookup by id
        if "id" in query and isinstance(query["id"], str) and len(query) == 1:
            snap = await self._doc_ref(query["id"]).get()
            if not snap.exists:
                return None
            d = snap.to_dict() or {}
            return _project(d, projection or {})
        q, post = _build_query(self._ref(), query)
        async for snap in q.limit(20).stream():
            d = snap.to_dict() or {}
            if post and not _matches_post(d, post):
                continue
            return _project(d, projection or {})
        return None

    # ---- insert / update / delete ----
    async def insert_one(self, doc: dict):
        if "id" not in doc:
            raise ValueError("Document needs 'id' field")
        await self._doc_ref(doc["id"]).set(doc)
        return doc

    async def update_one(self, query: dict, update: dict):
        target_id = None
        if "id" in query and isinstance(query["id"], str):
            target_id = query["id"]
        else:
            doc = await self.find_one(query, {"id": 1})
            if doc:
                target_id = doc.get("id")
        if not target_id:
            return type("Res", (), {"matched_count": 0, "modified_count": 0})()
        payload = update.get("$set", update)
        await self._doc_ref(target_id).update(payload)
        return type("Res", (), {"matched_count": 1, "modified_count": 1})()

    async def update_many(self, query: dict, update: dict):
        cursor = self.find(query, {"id": 1})
        rows = await cursor.to_list(5000)
        payload = update.get("$set", update)
        count = 0
        for r in rows:
            await self._doc_ref(r["id"]).update(payload)
            count += 1
        return type("Res", (), {"matched_count": count, "modified_count": count})()

    async def find_one_and_update(self, query: dict, update: dict, return_document=True, projection=None):
        result = await self.update_one(query, update)
        if result.matched_count == 0:
            return None
        # fetch again
        if "id" in query:
            return await self.find_one({"id": query["id"]}, projection)
        return await self.find_one(query, projection)

    async def delete_one(self, query: dict):
        target_id = None
        if "id" in query and isinstance(query["id"], str):
            target_id = query["id"]
        else:
            doc = await self.find_one(query, {"id": 1})
            if doc:
                target_id = doc.get("id")
        if not target_id:
            return type("Res", (), {"deleted_count": 0})()
        await self._doc_ref(target_id).delete()
        return type("Res", (), {"deleted_count": 1})()

    async def count_documents(self, query: dict):
        q, post = _build_query(self._ref(), query)
        if not post:
            agg = await q.count().get()
            try:
                return agg[0][0].value
            except Exception:
                pass
        # fallback streaming
        n = 0
        async for snap in q.stream():
            d = snap.to_dict() or {}
            if post and not _matches_post(d, post):
                continue
            n += 1
        return n

    async def create_index(self, *args, **kwargs):
        # Firestore manages single-field indexes automatically.
        return None

    def aggregate(self, pipeline):
        # Aggregation pipelines are not natively supported. The app handles
        # all aggregations in Python (see stats endpoint) but we still expose
        # this method for legacy code paths.
        return _AggregateCursor(self, pipeline)


class _AggregateCursor:
    def __init__(self, coll, pipeline):
        self._coll = coll
        self._pipeline = pipeline

    async def to_list(self, length=None):
        # Manually evaluate a small subset of pipeline operators
        match = {}
        group_field = None
        sort_field = None
        sort_dir = -1
        unwind_field = None
        for step in self._pipeline:
            if "$match" in step:
                match = step["$match"]
            elif "$unwind" in step:
                spec = step["$unwind"]
                if isinstance(spec, dict):
                    unwind_field = spec["path"].lstrip("$")
                else:
                    unwind_field = spec.lstrip("$")
            elif "$group" in step:
                gid = step["$group"]["_id"]
                if isinstance(gid, str):
                    group_field = gid.lstrip("$")
            elif "$sort" in step:
                sort_field = next(iter(step["$sort"].keys()))
                sort_dir = step["$sort"][sort_field]
        # Stream + filter + group
        rows = await self._coll.find(match).to_list(5000)
        counter = {}
        for r in rows:
            if unwind_field:
                values = r.get(unwind_field) or []
                if not isinstance(values, list):
                    values = [values]
                for v in values:
                    counter[v] = counter.get(v, 0) + 1
            else:
                key = r.get(group_field) if group_field else None
                counter[key] = counter.get(key, 0) + 1
        out = [{"_id": k, "count": v} for k, v in counter.items()]
        if sort_field == "count":
            out.sort(key=lambda x: x["count"], reverse=(sort_dir == -1))
        return out[:length] if length else out


class FirestoreDB:
    """Mimics motor's `database` object: db.collection_name -> Collection."""
    def __getattr__(self, name: str) -> Collection:
        return Collection(name)

    def __getitem__(self, name: str) -> Collection:
        return Collection(name)


db = FirestoreDB()
