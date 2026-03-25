from openrouter import OpenRouter
from openrouter.components import MessageTypedDict

JSON_SCHEMA = {
    "name": "output schema",
    "schema": {"anyOf": [
        {
            "type": "object",
            "properties": {
                "command": {"const": "list_sections"},
                "year": {"type": "integer"},
                "term": {
                    "type": "string",
                    "enum": ["spring", "summer", "fall"]
                },
                "subject": {"type": "string"},
                "course_num": {"type": "integer"}
            },
            "required": ["command", "year", "term", "subject", "course_num"],
            "additionalProperties": False
        },
        {
            "type": "object",
            "properties": {
                "command": {"const": "message"},
                "contents": {"type": "string"}
            },
            "required": ["command", "contents"],
            "additionalProperties": False
        }
    ]}
}

def query_llm(open_router: OpenRouter, model: str, context: list[MessageTypedDict]) -> str:

    response = open_router.chat.send(
        model = model,
        messages = context,
        response_format = {
            "type": "json_schema",
            "json_schema": JSON_SCHEMA
        }
    )

    return response.choices[0].message.content