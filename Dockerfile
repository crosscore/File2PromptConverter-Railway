FROM python:3.12-slim

WORKDIR /app

# Install curl
RUN apt-get update && apt-get install -y curl

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and static files
COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
