from llm import query_llm, command_adapter, MessageCommand
from openrouter import OpenRouter
from flask import Flask, jsonify, request
from flask_cors import CORS
import dotenv
import os


app = Flask(__name__)
CORS(app)

def update_context(context: list, prompt: str):

    dotenv.load_dotenv()
    open_router = OpenRouter(
        api_key = os.environ["OPENROUTER_KEY"]
    )

    context.append({
        "role": "user",
        "content": f"[USER] {prompt}"
    })

    while True:

        response = query_llm(open_router, "deepseek/deepseek-v3.2", context)
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

if __name__ == "__main__":
    app.run(debug = True, port = 5001)
