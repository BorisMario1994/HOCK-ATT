# Use an official Python image as the base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if needed for Python packages)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements if you have them (uncomment if requirements.txt exists)
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Install Node.js (if you need to run server.js or use npm for any reason)
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js dependencies if needed
# RUN npm install

# Expose the port your backend runs on (adjust as needed)
EXPOSE 5000

# Set the default command (adjust as needed: python, node, etc.)
# For Python relay_server.py:
CMD ["python", "relay_server.py"]
# Or, if you want to run server.js with Node.js:
# CMD ["node", "server.js"] 