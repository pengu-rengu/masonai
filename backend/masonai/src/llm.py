from typing import Annotated, Literal

from openrouter import OpenRouter
from openrouter.components import MessageTypedDict
from pydantic import BaseModel, Field, TypeAdapter

from fetch import Term, fetch_courses, fetch_sections, fetch_subjects
from filter import Filter, filter_models


def format_models(models: list[BaseModel]) -> str:
    blocks = []
    for model in models:
        lines = [f"{field}: {value}" for field, value in model.model_dump().items()]
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks)


def filter_and_slice(models: list[BaseModel], filters: dict[str, Filter], offset: int, limit: int) -> list[BaseModel]:
    filtered_models = filter_models(models, filters)
    return filtered_models[offset:offset + limit]


class MessageCommand(BaseModel):
    command: Literal["message"]
    contents: str

    def run(self) -> str:
        return self.contents


class ListSubjectsCommand(BaseModel):
    command: Literal["list_subjects"]
    filters: dict[str, Filter] = Field(default_factory=dict)
    offset: int = Field(ge=0)
    limit: int = Field(ge=1, le=10)

    def run(self) -> str:
        subjects = filter_and_slice(fetch_subjects(), self.filters, self.offset, self.limit)
        return format_models(subjects)


class ListCoursesCommand(BaseModel):
    command: Literal["list_courses"]
    subject: str
    filters: dict[str, Filter] = Field(default_factory=dict)
    offset: int = Field(ge=0)
    limit: int = Field(ge=1, le=10)

    def run(self) -> str:
        courses, failed = fetch_courses(self.subject.upper())
        courses = filter_and_slice(courses, self.filters, self.offset, self.limit)
        return f"{format_models(courses)}\n\nFailed to parse {failed} courses"


class ListSectionsCommand(BaseModel):
    command: Literal["list_sections"]
    year: int
    term: Literal["spring", "summer", "fall"]
    subject: str
    course_num: int
    filters: dict[str, Filter] = Field(default_factory=dict)
    offset: int = Field(ge=0)
    limit: int = Field(ge=1, le=10)

    def run(self) -> str:
        term_enum = {
            "spring": Term.SPRING,
            "summer": Term.SUMMER,
            "fall": Term.FALL
        }[self.term]
        sections, failed = fetch_sections(self.year, term_enum, self.subject.upper(), self.course_num)
        sections = filter_and_slice(sections, self.filters, self.offset, self.limit)
        return f"{format_models(sections)}\n\nFailed to parse {failed} sections"


Command = Annotated[
    MessageCommand | ListSubjectsCommand | ListCoursesCommand | ListSectionsCommand,
    Field(discriminator="command")
]

command_adapter = TypeAdapter(Command)

JSON_SCHEMA = {
    "name": "output schema",
    "schema": command_adapter.json_schema()
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
