from typing import Annotated, Literal

from openrouter import OpenRouter
from openrouter.components import MessageTypedDict
from pydantic import BaseModel, Field, TypeAdapter

from fetch import ClassSection, Course, Subject, Term, fetch_courses, fetch_sections, fetch_subjects
from filter import Filter, filter_models


def query_subjects() -> list[Subject]:
    return fetch_subjects()


def query_courses(subject: str) -> list[Course]:
    courses, _failed = fetch_courses(subject.upper())
    return courses


def query_sections(year: int, term: str, subject: str, course_num: int) -> list[ClassSection]:
    sections, _failed = fetch_sections(year, Term[term.upper()], subject.upper(), course_num)
    return sections


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
    filters: dict[str, Filter]
    offset: int = Field(ge = 0)
    limit: int = Field(ge = 1, le = 10)

    def run(self) -> str:
        subjects = filter_and_slice(query_subjects(), self.filters, self.offset, self.limit)
        return format_models(subjects)


class ListCoursesCommand(BaseModel):
    command: Literal["list_courses"]
    subject: str
    filters: dict[str, Filter]
    offset: int = Field(ge=0)
    limit: int = Field(ge=1, le=10)

    def run(self) -> str:
        courses = filter_and_slice(query_courses(self.subject), self.filters, self.offset, self.limit)
        return format_models(courses)


class ListSectionsCommand(BaseModel):
    command: Literal["list_sections"]
    year: int
    term: Literal["spring", "summer", "fall"]
    subject: str
    course_num: int
    filters: dict[str, Filter]
    offset: int = Field(ge=0)
    limit: int = Field(ge=1, le=10)

    def run(self) -> str:
        sections = filter_and_slice(
            query_sections(self.year, self.term, self.subject, self.course_num),
            self.filters,
            self.offset,
            self.limit
        )
        return format_models(sections)


Command = Annotated[
    MessageCommand | ListSubjectsCommand | ListCoursesCommand | ListSectionsCommand,
    Field(discriminator="command")
]

command_adapter = TypeAdapter(Command)


def query_llm(open_router: OpenRouter, model: str, context: list[MessageTypedDict]) -> str:
    response = open_router.chat.send(
        model = model,
        messages = context,
        response_format = {
            "type": "json_object"
        }
    )

    return response.choices[0].message.content
