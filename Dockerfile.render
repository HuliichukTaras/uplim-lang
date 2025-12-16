# Hybrid Image: Python + Node.js
FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node deps
COPY package.json package-lock.json* ./
RUN npm ci

# Copy Source
COPY . .

# Environment
ENV PORT=10000
EXPOSE 10000

# Command
CMD ["gunicorn", "server:app", "--bind", "0.0.0.0:10000"]
