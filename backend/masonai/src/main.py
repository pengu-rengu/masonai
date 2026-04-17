from llm import query_llm, command_adapter, MessageCommand, MakeScheduleCommand
from openrouter import OpenRouter
from flask import Flask, jsonify, request
from flask_cors import CORS
from fetch import Term, fetch_courses, fetch_sections, fetch_subjects
import dotenv
import json
import os

MAX_LLM_TURNS = 15


class LLMRetryExhausted(Exception):
    pass


TITLE_SYSTEM_PROMPT = (
    "You generate concise chat titles. Given the user's first message in a new chat, "
    "respond with a 2 to 5 word title describing the topic. No punctuation, no quotes. "
    'Respond with a JSON object: {"title": str}'
)


def build_open_router() -> OpenRouter:
    dotenv.load_dotenv()
    return OpenRouter(api_key=os.environ["OPENROUTER_KEY"])


def generate_title(open_router: OpenRouter, msg: str, model: str) -> str:
    response = open_router.chat.send(
        model=model,
        messages=[
            {"role": "system", "content": TITLE_SYSTEM_PROMPT},
            {"role": "user", "content": msg}
        ],
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)["title"]


app = Flask(__name__)
CORS(app)

def update_context(context: list, prompt: str, model: str):

    open_router = build_open_router()

    context.append({
        "role": "user",
        "content": f"[USER] {prompt}"
    })

    retry_messages = []
    for _attempt in range(MAX_LLM_TURNS):

        response = query_llm(open_router, model, context + retry_messages)
        print(response)

        try:
            command = command_adapter.validate_json(response)
        except Exception as ex:
            retry_messages.append({"role": "assistant", "content": response})
            retry_messages.append({"role": "user", "content": f"[ERROR] invalid command: {ex}"})
            continue

        context.append({
            "role": "assistant",
            "content": response
        })

        if isinstance(command, (MessageCommand, MakeScheduleCommand)):
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

    raise LLMRetryExhausted(
        f"LLM failed to produce a valid command after {MAX_LLM_TURNS} attempts"
    )

@app.post("/initial_msg")
def initial_msg():
    with open("src/prompt.md", "r") as file:
        context = [{
            "role": "system",
            "content": file.read()
        }]
    
    print(request.json["model"])
    try:
        update_context(context, request.json["msg"], request.json["model"])
    except Exception as ex:
        return jsonify({"error": str(ex)}), 503

    return jsonify({
        "context": context
    })

@app.post("/msg")
def msg():
    context = request.json["context"]

    try:
        update_context(context, request.json["msg"], request.json["model"])
    except Exception as ex:
        return jsonify({"error": str(ex)}), 503

    return jsonify({
        "context": context
    })

@app.post("/title")
def title():
    chat_title = generate_title(
        build_open_router(),
        request.json["msg"],
        request.json["model"]
    )
    return jsonify({"title": chat_title})


@app.get("/subjects")
def subjects():
    return jsonify([subject.model_dump() for subject in fetch_subjects()])

@app.get("/courses/<subject>")
def courses(subject: str):
    course_list, _failed = fetch_courses(subject.upper())
    return jsonify([course.model_dump() for course in course_list])

@app.get("/sections/<int:year>/<term>/<subject>/<int:course_num>")
def sections(year: int, term: str, subject: str, course_num: int):
    try:
        term_enum = Term[term.upper()]
    except KeyError:
        return jsonify({"error": f"unknown term: {term}"}), 400

    section_list, _failed = fetch_sections(year, term_enum, subject.upper(), course_num)
    return jsonify([section.model_dump() for section in section_list])

if __name__ == "__main__":
    app.run(host = "0.0.0.0", port = 5001)
