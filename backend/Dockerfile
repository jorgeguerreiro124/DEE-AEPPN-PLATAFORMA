# Backend Docker image for Cloud Run deployment
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps for cryptography / google libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libffi-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . ./

# Cloud Run injects PORT (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD exec uvicorn server:app --host 0.0.0.0 --port ${PORT}
