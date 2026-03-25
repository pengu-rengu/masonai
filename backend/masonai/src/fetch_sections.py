
import requests
from bs4 import BeautifulSoup
from enum import Enum
from pydantic import BaseModel
from datetime import datetime

class Term(Enum):
    SPRING = 10
    SUMMER = 40
    FALL = 70

def get_url(year: int, term: Term, subject: str, course_num: int) -> str:
    return f"https://patriotweb.gmu.edu/pls/prod/bwckctlg.p_disp_listcrse?term_in={year}{term.value}&subj_in={subject}&crse_in={course_num}&schd_in=%"

class ClassSection(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    days: list[str]
    building: str
    room: str
    instructor: str

def fetch_sections(year: int, term: Term, subject: str, course_num: int) -> tuple[list[ClassSection], int]:
    url = get_url(year, term, subject, course_num)

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

            sections.append(ClassSection(
                title = title,
                start_time = start_time,
                end_time = end_time,
                days = days,
                building = building,
                room = loc_strs[-1],
                instructor = instructor
            ))
        except:
            failed += 1

    return sections, failed




if __name__ == "__main__":
    url = get_url(2026, Term.SPRING, "HNRS", 240)
    print(url)