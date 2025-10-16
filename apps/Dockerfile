FROM python:3.12-slim

# Prevents writing .pyc files and ensures real-time logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory for manage.py
WORKDIR /apps

# Install system dependencies (required for psycopg2 and others)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and wheel before install
RUN pip install --upgrade pip setuptools wheel

# Copy requirements.txt from root (since context is .)
COPY ../requirements.txt /apps/requirements.txt

# Install from PyPI
RUN pip install --no-cache-dir -r /apps/requirements.txt

# Copy Django backend apps and main project
COPY . /apps/
COPY ../thesis /thesis

# Expose Gunicorn port
EXPOSE 8000

# Start Gunicorn (set working dir to thesis project)
CMD ["gunicorn", "--chdir", "/thesis", "thesis.wsgi:application", "--bind", "0.0.0.0:8000"]
