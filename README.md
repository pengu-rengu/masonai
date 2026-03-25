# how to run

set openrouter key

```bash
cd backend/masonai
echo "OPENROUTER_KEY=\"<api key goes here>\"" > .env
```

run backend

```bash
cd backend/masonai
uv sync
uv run src/main.py
```

run frontend

```bash
cd frontend/masonai
npm install
npm run dev
```