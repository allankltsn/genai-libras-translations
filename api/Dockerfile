# API Libras (POC local). Base fixada por tag E digest (python:3.13-slim, indice multi-arch).
FROM python:3.13-slim@sha256:2d44738ebf4ce5f63b9d9ea871e9c7cfdc0426f7b0c97cac915fd88ded1d86bb

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Somente o lock (versoes exatas + hashes), so wheels, sem resolver dependencias.
# Nota: o lock inclui pytest/httpx (requirements.in); sao pequenos e ficam inertes.
COPY requirements.lock ./
RUN pip --isolated install --only-binary=:all: --require-hashes --no-deps -r requirements.lock \
 && rm requirements.lock

# Somente o codigo de runtime (sem tests/, scripts/, .venv, .env: tambem barrados por api/.dockerignore).
COPY app ./app
COPY adapters ./adapters
COPY agent ./agent
COPY schemas ./schemas
COPY vocabulary ./vocabulary

RUN useradd --system --uid 10001 --user-group --no-create-home --shell /usr/sbin/nologin app
USER 10001:10001

EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/readyz', timeout=3)"]

# 0.0.0.0 so DENTRO do container; o compose publica apenas em 127.0.0.1. Sem --reload.
# Sem --forwarded-allow-ips: X-Forwarded-For de terceiros NAO e confiado (padrao: so 127.0.0.1).
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
