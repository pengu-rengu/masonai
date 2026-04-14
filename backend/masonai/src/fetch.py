import os
import re
import dotenv
import requests
from bs4 import BeautifulSoup
from enum import Enum
from pydantic import BaseModel
from datetime import datetime
from supabase import Client, create_client


class Term(Enum):
    SPRING = 10
    SUMMER = 40
    FALL = 70


def get_sections_url(year: int, term: Term, subject: str, course_num: int) -> str:
    return f"https://patriotweb.gmu.edu/pls/prod/bwckctlg.p_disp_listcrse?term_in={year}{term.value}&subj_in={subject}&crse_in={course_num}&schd_in=%"


def get_courses_url(subject: str) -> str:
    return f"https://catalog.gmu.edu/courses/{subject.lower()}/"


class Subject(BaseModel):
    full_name: str
    subject: str

class Course(BaseModel):
    subject: str
    course_num: int
    description: str
    additional_info: str


class ClassSection(BaseModel):
    title: str
    subject: str
    course_num: int
    term: str
    year: int
    start_time: datetime
    end_time: datetime
    days: list[str]
    building: str
    room: str
    instructor: str

def fetch_subjects() -> list[Subject]:
    response = requests.get("https://catalog.gmu.edu/courses/")
    soup = BeautifulSoup(response.text, "html.parser")

    subjects = []

    left_col = soup.find("div", id = "left-col")
    subject_list = left_col.find("ul", class_ = "nav levelone")

    for item in subject_list.find_all("li"):
        parts = item.text.split("(")
        subject = Subject(
            full_name = parts[0].strip(),
            subject = parts[1].strip()[:-1]
        )
        subjects.append(subject)

    return subjects


def fetch_courses(subject: str) -> tuple[list[Course], int]:
    url = get_courses_url(subject)
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    courses = []
    failed = 0

    for block in soup.find_all("div", class_="courseblock"):
        try:
            code_el = block.find("strong", class_="cb_code")
            code_text = code_el.text.rstrip(":")
            parts = code_text.split()
            subject = parts[0]

            num_match = re.match(r"\d+", parts[1])
            if not num_match:
                continue
            course_num = int(num_match.group(0))

            description_el = block.find("div", class_="courseblockdesc")
            description = description_el.text

            extras = [extra.text for extra in block.find_all("div", class_="courseblockextra")]
            additional_info = "\n".join(extras)

            course = Course(
                subject = subject,
                course_num = course_num,
                description = description,
                additional_info = additional_info,
            )
            courses.append(course)
        except:
            failed += 1

    return courses, failed


def fetch_sections(year: int, term: Term, subject: str, course_num: int) -> tuple[list[ClassSection], int]:
    url = get_sections_url(year, term, subject, course_num)
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    div = soup.find("div", class_="pagebodydiv")
    table = div.find("table")

    rows = table.find_all("tr", recursive = False)
    n_rows = len(rows)

    sections = []
    failed = 0

    for i in range(0, n_rows, 3):
        try:
            title = rows[i].find("a").text

            info_table = rows[i + 2].find("table")
            info_cells = info_table.find_all("td")

            time_strs = info_cells[1].text.split("-")
            loc_strs = info_cells[3].text.split()

            start_time = datetime.strptime(time_strs[0].strip(), "%I:%M %p")
            end_time = datetime.strptime(time_strs[1].strip(), "%I:%M %p")
            days = list(info_cells[2].text)
            building = " ".join(loc_strs[:-1])
            instructor = " ".join(info_cells[-1].text.split()[:-1])

            section = ClassSection(
                title = title,
                subject = subject,
                course_num = course_num,
                term = term.name.lower(),
                year = year,
                start_time = start_time,
                end_time = end_time,
                days = days,
                building = building,
                room = loc_strs[-1],
                instructor = instructor
            )
            sections.append(section)
        except:
            failed += 1

    return sections, failed


def get_supabase_client() -> Client:
    dotenv.load_dotenv()

    supabase_url = os.environ.get("SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_ANON_KEY")

    return create_client(supabase_url, service_role_key)


def clear_table(supabase: Client, table_name: str) -> None:
    supabase.table(table_name).delete().gte("id", 0).execute()


def format_time(value: datetime) -> str:
    return value.strftime("%H:%M:%S")


def insert_subject(supabase: Client, subject: Subject) -> None:
    supabase.table("subjects").insert({
        "subject": subject.subject,
        "full_name": subject.full_name
    }).execute()


def insert_course(supabase: Client, course: Course) -> None:
    supabase.table("courses").insert({
        "subject": course.subject,
        "course_num": course.course_num,
        "description": course.description,
        "additional_info": course.additional_info
    }).execute()


def insert_section(supabase: Client, section: ClassSection) -> None:
    supabase.table("class_sections").insert({
        "title": section.title,
        "subject": section.subject,
        "course_num": section.course_num,
        "term": section.term,
        "year": section.year,
        "start_time": format_time(section.start_time),
        "end_time": format_time(section.end_time),
        "days": "".join(section.days),
        "building": section.building,
        "room": section.room,
        "instructor": section.instructor
    }).execute()


def fetch(year: int, term: Term):
    supabase = get_supabase_client()

    clear_table(supabase, "class_sections")
    clear_table(supabase, "courses")
    clear_table(supabase, "subjects")

    subjects = fetch_subjects()

    for subject in subjects:
        print(subject.subject)
        insert_subject(supabase, subject)

        courses, failed_courses = fetch_courses(subject.subject)
        if failed_courses:
            print(f"Failed to parse {failed_courses} courses for {subject.subject}")

        for course in courses:
            print(course.subject)
            insert_course(supabase, course)

            sections, failed_sections = fetch_sections(year, term, course.subject, course.course_num)
            if failed_sections:
                print(f"Failed to parse {failed_sections} sections for {course.subject} {course.course_num}")

            for section in sections:
                insert_section(supabase, section)


if __name__ == "__main__":
    fetch(2026, Term.FALL)
