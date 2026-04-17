FROM ghcr.io/astral-sh/uv:python3.14-bookworm-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

COPY src ./src

ENV PYTHONUNBUFFERED=1

EXPOSE 5001

CMD ["uv", "run", "src/main.py"]
