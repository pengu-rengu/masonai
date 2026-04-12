import requests
from bs4 import BeautifulSoup
from pydantic import BaseModel

class Group(BaseModel):
    title: str
    categories: list[str]
    mission: str

def fetch_groups() -> tuple[list[Group], int]:
    response = requests.get("https://mason360.gmu.edu/club_signup?view=all&")
    soup = BeautifulSoup(response.text, "html.parser")
    
    groups = []
    failed = 0

    for item in soup.find_all("div", class_="media"):
        try:
            heading = item.find("h2", class_="media-heading")
            title = heading.find("a").text.strip()

            category_el = item.find("p", class_="grey-element")
            categories = [part.strip() for part in category_el.text.split("-")]

            mission_el = item.find("p", class_="noOutlineOnFocus")
            br = mission_el.find("br")
            mission = br.next_sibling.strip() if br and br.next_sibling else ""

            group = Group(
                title=title,
                categories=categories,
                mission=mission,
            )
            groups.append(group)
        except:
            failed += 1

    return groups, failed

if __name__ == "__main__":
    groups, failed = fetch_groups()

    for group in groups:
        print(group.model_dump_json(indent=2))

    print(f"\nParsed {len(groups)} groups, failed {failed}")