from llm import query_llm, command_adapter, MessageCommand
from openrouter import OpenRouter
from flask import Flask, jsonify, request
from flask_cors import CORS
import dotenv
import json
import os

TITLE_MODEL = "deepseek/deepseek-v3.2"
TITLE_SYSTEM_PROMPT = (
    "You generate concise chat titles. Given the user's first message in a new chat, "
    "respond with a 2 to 5 word title describing the topic. No punctuation, no quotes."
)
TITLE_JSON_SCHEMA = {
    "name": "title schema",
    "schema": {
        "type": "object",
        "properties": {"title": {"type": "string"}},
        "required": ["title"],
        "additionalProperties": False
    }
}


def build_open_router() -> OpenRouter:
    dotenv.load_dotenv()
    return OpenRouter(api_key=os.environ["OPENROUTER_KEY"])


def generate_title(open_router: OpenRouter, msg: str) -> str:
    response = open_router.chat.send(
        model=TITLE_MODEL,
        messages=[
            {"role": "system", "content": TITLE_SYSTEM_PROMPT},
            {"role": "user", "content": msg}
        ],
        response_format={
            "type": "json_schema",
            "json_schema": TITLE_JSON_SCHEMA
        }
    )
    return json.loads(response.choices[0].message.content)["title"]


app = Flask(__name__)
CORS(app)

def update_context(context: list, prompt: str):

    open_router = build_open_router()

    context.append({
        "role": "user",
        "content": f"[USER] {prompt}"
    })

    while True:

        response = query_llm(open_router, "deepseek/deepseek-v3.2", context)
        print(response)
        context.append({
            "role": "assistant",
            "content": response
        })

        try:
            command = command_adapter.validate_json(response)
        except Exception as ex:
            context.append({
                "role": "user",
                "content": f"[ERROR] invalid command: {ex}"
            })
            continue

        if isinstance(command, MessageCommand):
            return context

        try:
            output = command.run()
            context.append({
                "role": "user",
                "content": f"[OUTPUT]\n{output}"
            })
        except Exception as ex:
            context.append({
                "role": "user",
                "content": f"[ERROR] {ex}"
            })

@app.post("/initial_msg")
def initial_msg():
    with open("src/prompt.md", "r") as file:
        context = [{
            "role": "system",
            "content": file.read()
        }]

    update_context(context, request.json["msg"])

    return jsonify({
        "context": context
    })

@app.post("/msg")
def msg():
    context = request.json["context"]

    update_context(context, request.json["msg"])

    return jsonify({
        "context": context
    })

@app.post("/title")
def title():
    msg = request.json["msg"]
    chat_title = generate_title(build_open_router(), msg)
    return jsonify({"title": chat_title})

if __name__ == "__main__":
    app.run(debug = True, port = 5001)
