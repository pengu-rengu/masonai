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
import SectionList from "@/components/SectionList";
import type { ClassSection } from "@/lib/schedules";
import { API_BASE } from "@/lib/api";

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
      const response = await fetch(`${API_BASE}/subjects`);
      if (!response.ok) {
        alert("Failed to load subjects");
        return;
      }
      setSubjects(await response.json() as Subject[]);
    }

    loadSubjects();
  }, []);

  const canSearch = Boolean(year && term && subject && courseNum);

  async function runSearch() {
    if (!subject) return;
    const url = `${API_BASE}/sections/${year}/${term}/${subject.subject}/${Number(courseNum)}`;
    const response = await fetch(url);
    if (!response.ok) {
      alert("Failed to load sections");
      return;
    }

    const rows = await response.json();
    setSections(rows.map((row: Record<string, string>) => ({
      title: row.title,
      startTime: row.start_time,
      endTime: row.end_time,
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
