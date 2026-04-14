import sys
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

from pydantic import ValidationError

TESTS_DIR = Path(__file__).resolve().parent
SRC_DIR = TESTS_DIR.parent / "src"
sys.path.insert(0, str(SRC_DIR))

import llm
from fetch import ClassSection, Course, Subject, Term
from filter import StringFilter


class CommandValidationTests(unittest.TestCase):
    def test_list_commands_require_offset(self):
        payloads = [
            {
                "command": "list_subjects",
                "limit": 2
            },
            {
                "command": "list_courses",
                "subject": "CS",
                "limit": 2
            },
            {
                "command": "list_sections",
                "year": 2026,
                "term": "fall",
                "subject": "CS",
                "course_num": 112,
                "limit": 2
            }
        ]

        for payload in payloads:
            with self.subTest(payload=payload["command"]):
                with self.assertRaises(ValidationError):
                    llm.command_adapter.validate_python(payload)

    def test_list_commands_reject_negative_offset(self):
        payloads = [
            {
                "command": "list_subjects",
                "offset": -1,
                "limit": 2
            },
            {
                "command": "list_courses",
                "subject": "CS",
                "offset": -1,
                "limit": 2
            },
            {
                "command": "list_sections",
                "year": 2026,
                "term": "fall",
                "subject": "CS",
                "course_num": 112,
                "offset": -1,
                "limit": 2
            }
        ]

        for payload in payloads:
            with self.subTest(payload=payload["command"]):
                with self.assertRaises(ValidationError):
                    llm.command_adapter.validate_python(payload)


class CommandRunTests(unittest.TestCase):
    def test_list_subjects_apply_offset_before_limit(self):
        subjects = [
            Subject(full_name="Accounting", subject="ACCT"),
            Subject(full_name="Biology", subject="BIOL"),
            Subject(full_name="Chemistry", subject="CHEM")
        ]
        command = llm.ListSubjectsCommand(command="list_subjects", offset=1, limit=1)

        with patch("llm.fetch_subjects", return_value=subjects):
            output = command.run()

        self.assertEqual(output, "full_name: Biology\nsubject: BIOL")

    def test_list_courses_apply_offset_after_filtering(self):
        courses = [
            Course(
                subject="CS",
                course_num=100,
                description="keep first",
                additional_info=""
            ),
            Course(
                subject="CS",
                course_num=200,
                description="skip second",
                additional_info=""
            ),
            Course(
                subject="CS",
                course_num=300,
                description="keep third",
                additional_info=""
            ),
            Course(
                subject="CS",
                course_num=400,
                description="keep fourth",
                additional_info=""
            )
        ]
        command = llm.ListCoursesCommand(
            command="list_courses",
            subject="cs",
            filters={
                "description": StringFilter(contains="keep")
            },
            offset=1,
            limit=1
        )

        with patch("llm.fetch_courses", return_value=(courses, 2)) as fetch_courses_mock:
            output = command.run()

        fetch_courses_mock.assert_called_once_with("CS")
        self.assertIn("course_num: 300", output)
        self.assertNotIn("course_num: 100", output)
        self.assertNotIn("course_num: 400", output)
        self.assertTrue(output.endswith("Failed to parse 2 courses"))

    def test_list_sections_offset_past_end_returns_footer_only(self):
        sections = [
            ClassSection(
                title="CS 112-001",
                start_time=datetime(1900, 1, 1, 9, 0),
                end_time=datetime(1900, 1, 1, 10, 15),
                days=["M", "W"],
                building="Exploratory Hall",
                room="1000",
                instructor="Prof Mason"
            )
        ]
        command = llm.ListSectionsCommand(
            command="list_sections",
            year=2026,
            term="fall",
            subject="cs",
            course_num=112,
            offset=5,
            limit=2
        )

        with patch("llm.fetch_sections", return_value=(sections, 3)) as fetch_sections_mock:
            output = command.run()

        fetch_sections_mock.assert_called_once_with(2026, Term.FALL, "CS", 112)
        self.assertEqual(output, "\n\nFailed to parse 3 sections")


if __name__ == "__main__":
    unittest.main()
