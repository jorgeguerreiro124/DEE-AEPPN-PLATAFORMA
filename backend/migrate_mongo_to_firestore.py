"""One-off migration script: MongoDB → Firestore.

Usage:
    cd /app/backend && python migrate_mongo_to_firestore.py

Reads MONGO_URL/DB_NAME from .env and writes everything to the Firestore
project configured by GOOGLE_APPLICATION_CREDENTIALS / FIREBASE_PROJECT_ID.
"""
import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from motor.motor_asyncio import AsyncIOMotorClient
from google.cloud import firestore

COLLECTIONS = ["users", "students", "student_files"]


async def main():
    mongo = AsyncIOMotorClient(os.environ["MONGO_URL"])
    mdb = mongo[os.environ["DB_NAME"]]
    fdb = firestore.AsyncClient(project=os.environ["FIREBASE_PROJECT_ID"])

    for coll in COLLECTIONS:
        print(f"\n=== {coll} ===")
        docs = await mdb[coll].find({}, {"_id": 0}).to_list(10000)
        print(f"  {len(docs)} documento(s) em Mongo")
        n = 0
        for d in docs:
            doc_id = d.get("id")
            if not doc_id:
                print(f"  Skipping doc without id: {d}")
                continue
            await fdb.collection(coll).document(doc_id).set(d)
            n += 1
        print(f"  → {n} migrado(s) para Firestore")

    print("\nMigração concluída ✅")
    mongo.close()


if __name__ == "__main__":
    asyncio.run(main())
