# backend/Dockerfile
FROM python:3.10-slim

# Set environment variables for strict Python execution
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install critical system dependencies required by OpenCV and ONNX
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Install Python dependencies first to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    --default-timeout=1000 \
    --index-url https://pypi.org/simple \
    --extra-index-url https://pypi.cloudflare.com/ \
    -r requirements.txt
# Copy the remaining application code
COPY . .

# Expose the FastAPI port
EXPOSE 8000

# Execute the ASGI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]# backend/Dockerfile
FROM python:3.10-slim

# Set environment variables for strict Python execution
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install critical system dependencies required by OpenCV and ONNX
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Install Python dependencies first to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the remaining application code
COPY . .

# Expose the FastAPI port
EXPOSE 8000

# Execute the ASGI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]