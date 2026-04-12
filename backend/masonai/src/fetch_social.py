from collections.abc import Iterator
from datetime import datetime, timezone
import requests
from bs4 import BeautifulSoup
from pydantic import BaseModel
from zoneinfo import ZoneInfo

GMU_TIMEZONE = ZoneInfo("America/New_York")
UNTITLED_EVENT_TITLE = "Untitled Event"

class Group(BaseModel):
    title: str
    categories: list[str]
    mission: str

class Event(BaseModel):
    title: str
    tags: list[str]
    start_time: datetime
    end_time: datetime
    location: str

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
                mission=mission
            )
            groups.append(group)
        except:
            failed += 1

    return groups, failed

def _iter_event_lines(data: str) -> Iterator[list[str]]:
    event_lines = []
    is_event = False

    for raw_line in data.splitlines():
        line = raw_line.rstrip("\r")

        if line == "BEGIN:VEVENT":
            event_lines = []
            is_event = True
            continue

        if line == "END:VEVENT":
            if is_event:
                yield event_lines

            event_lines = []
            is_event = False
            continue

        if is_event:
            event_lines.append(line)

def _parse_event_fields(event_lines: list[str]) -> dict[str, list[str]]:
    field_map: dict[str, list[str]] = {}

    for event_line in event_lines:
        if ":" not in event_line:
            continue

        field_name, field_value = event_line.split(":", 1)
        cleaned_value = field_value.strip()

        if field_name not in field_map:
            field_map[field_name] = []

        field_map[field_name].append(cleaned_value)

    return field_map

def _get_optional_field(field_map: dict[str, list[str]], field_name: str) -> str | None:
    field_values = field_map.get(field_name)
    if not field_values:
        return None

    return field_values[0]

def _get_required_field(field_map: dict[str, list[str]], field_name: str) -> str:
    field_value = _get_optional_field(field_map, field_name)
    if field_value is None:
        raise ValueError(f"Missing event field: {field_name}")

    return field_value

def _parse_event_title(field_map: dict[str, list[str]]) -> str:
    title = _get_optional_field(field_map, "SUMMARY;ENCODING=QUOTED-PRINTABLE")

    if title is None:
        title = _get_required_field(field_map, "SUMMARY")

    if not title:
        return UNTITLED_EVENT_TITLE

    return title

def _parse_event_datetime(field_value: str) -> datetime:
    utc_time = datetime.strptime(field_value, "%Y%m%dT%H%M%SZ")
    utc_time = utc_time.replace(tzinfo=timezone.utc)

    return utc_time.astimezone(GMU_TIMEZONE)

def _parse_event_tags(field_map: dict[str, list[str]]) -> list[str]:
    parsed_tags = []

    event_type = _get_optional_field(field_map, "CATEGORIES;X-CG-CATEGORY=event_type")
    if event_type:
        parsed_tags.append(event_type)

    event_tag_values = field_map.get("CATEGORIES;X-CG-CATEGORY=event_tags", [])
    for event_tag_value in event_tag_values:
        raw_tags = event_tag_value.split(",")
        for raw_tag in raw_tags:
            cleaned_tag = raw_tag.strip()
            if cleaned_tag:
                parsed_tags.append(cleaned_tag)

    unique_tags = []
    seen_tags = set()

    for tag_name in parsed_tags:
        if tag_name in seen_tags:
            continue

        unique_tags.append(tag_name)
        seen_tags.add(tag_name)

    return unique_tags

def _build_event(field_map: dict[str, list[str]]) -> Event:
    title = _parse_event_title(field_map)
    start_time = _parse_event_datetime(_get_required_field(field_map, "DTSTART"))
    end_time = _parse_event_datetime(_get_required_field(field_map, "DTEND"))
    location = _get_required_field(field_map, "LOCATION")
    tags = _parse_event_tags(field_map)

    return Event(
        title=title,
        tags=tags,
        start_time=start_time,
        end_time=end_time,
        location=location
    )

def fetch_events(data: str) -> tuple[list[Event], int]:
    events = []
    failed = 0

    for event_lines in _iter_event_lines(data):
        try:
            field_map = _parse_event_fields(event_lines)
            event = _build_event(field_map)
            events.append(event)
        except Exception:
            failed += 1

    return events, failed

if __name__ == "__main__":
    groups, failed = fetch_groups()

    for group in groups:
        print(group.model_dump_json(indent=2))

    print(f"\nParsed {len(groups)} groups, failed {failed}")
