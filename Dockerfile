# Use an official lightweight Python runtime
FROM python:3.14-slim

# Set working directory inside the container
WORKDIR /app

# Install minimal system dependencies required at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy build/dependency specifications first to maximize Docker layer caching
COPY pyproject.toml /app/
COPY README.md /app/

# Install the Python dependencies (excluding dev group and optional dependencies by default)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# Copy the rest of the application files
COPY . /app

# Re-install the package to ensure script entrypoints are properly configured
RUN pip install --no-cache-dir -e .

# Expose the proxy service port
EXPOSE 8082

# Configure environment variables
ENV HOST=0.0.0.0
ENV PORT=8082
ENV PYTHONUNBUFFERED=1

# Run the proxy via its registered script entrypoint
CMD ["free-claude-code"]
