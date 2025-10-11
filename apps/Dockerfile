FROM python:3.12-slim

# Environment setup
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /apps

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and base tools
RUN pip install --upgrade pip setuptools wheel

# Copy and install dependencies
COPY requirements.txt /apps/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy Django project files
COPY . /apps/

EXPOSE 8000

# Start Gunicorn — update “thesis” if your Django project folder name differs
CMD ["gunicorn", "thesis.wsgi:application", "--bind", "0.0.0.0:8000"]
