# Use an official Python image
FROM python:3.10

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies including tzdata for timezone data and tools for adding repos
# Install system dependencies including gpg
# Install system dependencies including gpg
RUN apt-get update \
 && apt-get remove -y unixodbc unixodbc-dev odbcinst libodbc2 libodbc1 \
 && apt-get install -y --no-install-recommends \
      gcc \
      gnupg2 \
      curl \
      tzdata \
 && curl -sSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg \
 && mv microsoft.gpg /etc/apt/trusted.gpg.d/ \
 && curl -sSL https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
 && apt-get update \
 && ACCEPT_EULA=Y apt-get install -y msodbcsql17 unixodbc-dev \
 && rm -rf /var/lib/apt/lists/*



# Optional: install mssql-tools (sqlcmd and bcp utilities), uncomment if needed
# RUN ACCEPT_EULA=Y apt-get install -y mssql-tools \
#  && echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc \
#  && /bin/bash -c "source ~/.bashrc"

# Copy project files
COPY . /app

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Expose the Flask default port
EXPOSE 5000

ENV FLASK_APP=relay_server.py
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000"]

