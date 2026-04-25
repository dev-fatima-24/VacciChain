FROM python:3.11.7-slim@sha256:bae67dbbd3c2c9d94a3cf02c8a1cfc3c6f3c5d5e3d9b7195f8c0a06d09d4f5f2 AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.11.7-slim@sha256:bae67dbbd3c2c9d94a3cf02c8a1cfc3c6f3c5d5e3d9b7195f8c0a06d09d4f5f2 AS production
WORKDIR /app
COPY --from=builder /install /usr/local
COPY . .
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
