FROM ghcr.io/astral-sh/uv:python3.14-bookworm-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

COPY src ./src
COPY context.json ./
COPY .env ./

ENV PYTHONUNBUFFERED=1

EXPOSE 5001

CMD ["uv", "run", "python", "src/main.py"]
