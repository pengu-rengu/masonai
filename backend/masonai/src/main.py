from fetch_academics import fetch_sections, Term
from llm import query_llm
from openrouter import OpenRouter
from flask import Flask, jsonify, request
from flask_cors import CORS
import dotenv
import os
import json


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

        command = json.loads(response)

        if command["command"] == "message":

            return context

        elif command["command"] == "list_sections":
            term = {
                "spring": Term.SPRING,
                "summer": Term.SUMMER,
                "fall": Term.FALL
            }[command["term"]]

            try:
                sections, failed = fetch_sections(command["year"], term, command["subject"].upper(), command["course_num"])

                output = ""
                for section in sections:
                    output += f"Title: {section.title}\n"
                    output += f"Time: {section.start_time.strftime('%I:%M %p')} - {section.end_time.strftime('%I:%M %p')}\n"
                    output += f"Days: {', '.join(section.days)}\n"
                    output += f"Building: {section.building}\n"
                    output += f"Room: {section.room}\n"
                    output += f"Instructor: {section.instructor}\n\n"

                output += f"Failed to parse {failed} sections"

                context.append({
                    "role": "user",
                    "content": f"[OUTPUT]\n{output}"
                })

            except Exception as ex:
                context.append({
                    "role": "user",
                    "content": f"[ERROR] {ex}"
                })
            
        else:
            context.append({
                "role": "user",
                "content": f"[ERROR] invalid command"
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