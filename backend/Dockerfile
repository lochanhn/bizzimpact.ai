FROM python:3.14-slim-bookworm
COPY --from=ghcr.io/astral-sh/uv:0.9.8 /uv /usr/local/bin/uv
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy PYTHONUNBUFFERED=1 PATH=/app/.venv/bin:$PATH
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY app ./app
COPY data ./data
COPY seed_catalog.py ./seed_catalog.py
RUN useradd --create-home --uid 10001 app && mkdir .runtime && chown app:app .runtime
USER app
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
