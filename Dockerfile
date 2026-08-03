FROM python:3.14-slim

ENV HOST=0.0.0.0 \
    PORT=8082 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY pyproject.toml README.md .env.example ./
COPY api ./api
COPY cli ./cli
COPY config ./config
COPY core ./core
COPY messaging ./messaging
COPY providers ./providers

RUN pip install --no-cache-dir . \
    && addgroup --system luxengine \
    && adduser --system --ingroup luxengine --home /app luxengine \
    && chown -R luxengine:luxengine /app

EXPOSE 8082

USER luxengine

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8082/health', timeout=3)"

CMD ["free-claude-code"]
