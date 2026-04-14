"use client";
import {
  Autocomplete,
  Button,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SectionList from "@/components/SectionList";
import type { ClassSection } from "@/lib/schedules";

const TERMS = [
  { value: "fall", label: "Fall" },
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" }
];

interface Subject {
  subject: string;
  full_name: string;
}

export default function SectionSearch({ onAdd }: { onAdd: (section: ClassSection) => void }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [term, setTerm] = useState<string>("fall");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [courseNum, setCourseNum] = useState<string>("");

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);

  useEffect(() => {
    async function loadSubjects() {
      const { data, error } = await supabase
        .from("subjects")
        .select("subject, full_name")
        .order("subject");

      if (error) {
        alert("Failed to load subjects: " + error.message);
        return;
      }

      setSubjects(data as Subject[]);
    }

    loadSubjects();
  }, []);

  const canSearch = Boolean(year && term && subject && courseNum);

  async function runSearch() {
    if (!subject) return;
    const { data, error } = await supabase
      .from("class_sections")
      .select("title, start_time, end_time, days, building, room, instructor")
      .eq("year", year)
      .eq("term", term)
      .eq("subject", subject.subject)
      .eq("course_num", Number(courseNum))
      .order("title");

    if (error) {
      alert("Failed to load sections: " + error.message);
      return;
    }

    setSections((data ?? []).map((row) => ({
      title: row.title,
      startTime: row.start_time.slice(0, 5),
      endTime: row.end_time.slice(0, 5),
      days: row.days,
      building: row.building,
      room: row.room,
      instructor: row.instructor
    })));
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Add section</Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          label="Year"
          type="number"
          size="small"
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
          sx={{ width: 120 }}
        />
        <Select size="small" value={term} onChange={(event) => setTerm(event.target.value)}>
          {TERMS.map((termOption) => (
            <MenuItem key={termOption.value} value={termOption.value}>
              {termOption.label}
            </MenuItem>
          ))}
        </Select>
        <Autocomplete
          size="small"
          options={subjects}
          value={subject}
          onChange={(_event, next) => setSubject(next)}
          getOptionLabel={(option) => `${option.subject} — ${option.full_name}`}
          isOptionEqualToValue={(option, value) => option.subject === value.subject}
          renderInput={(params) => <TextField {...params} label="Subject" />}
          sx={{ minWidth: 260 }}
        />
        <TextField
          label="Course #"
          type="number"
          size="small"
          value={courseNum}
          onChange={(event) => setCourseNum(event.target.value)}
          sx={{ width: 120 }}
        />
        <Button variant="outlined" onClick={runSearch} disabled={!canSearch}>
          Search
        </Button>
      </Stack>

      <SectionList
        sections={sections}
        actionIcon={<AddIcon />}
        actionLabel="Add section"
        onAction={(index) => onAdd(sections[index])}
      />
    </Stack>
  );
}
