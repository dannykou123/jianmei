FROM python:3.11-slim

# Pillow 需要 libfreetype；安裝 Noto CJK 字型做中文 rasterize、openssl 產生自簽憑證
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-noto-cjk \
    libfreetype6 \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 產生自簽憑證（CN + SAN 都指向 NAS IP，有效期 10 年）
# 手機/Safari 需要 subjectAltName 才會信任
RUN openssl req -x509 -newkey rsa:2048 \
    -keyout key.pem -out cert.pem \
    -days 3650 -nodes \
    -subj "/CN=192.168.50.103" \
    -addext "subjectAltName=IP:192.168.50.103"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", \
     "--ssl-keyfile", "key.pem", "--ssl-certfile", "cert.pem"]
