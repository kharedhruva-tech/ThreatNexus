FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Expose port (default 8000, Railway provides PORT env var)
EXPOSE 8000

ENV PORT=8000
CMD ["sh", "-c", "python seed_data.py || true; uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
