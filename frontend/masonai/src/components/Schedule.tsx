"use client";
import { Box, Stack, Typography } from "@mui/material";
import { formatTime, type ClassSection, type Schedule as ScheduleType } from "@/lib/schedules";

const DAYS = [
  { code: "M", label: "Monday" },
  { code: "T", label: "Tuesday" },
  { code: "W", label: "Wednesday" },
  { code: "R", label: "Thursday" },
  { code: "F", label: "Friday" }
];

function SectionCard({ section }: { section: ClassSection }) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        p: 1
      }}
    >
      <Typography variant="subtitle2">{section.title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {formatTime(section.startTime)} - {formatTime(section.endTime)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {section.building} {section.room}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {section.instructor}
      </Typography>
    </Box>
  );
}

function DayColumn({ label, sections }: { label: string; sections: ClassSection[] }) {
  return (
    <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: "bold"}}>
        {label}
      </Typography>
      {sections.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          -
        </Typography>
      ) : (
        sections.map((section) => (
          <SectionCard key={`${section.title}-${section.startTime}`} section={section} />
        ))
      )}
    </Stack>
  );
}

export default function Schedule({ schedule }: { schedule: ScheduleType }) {
  return (
    <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
      {DAYS.map(({ code, label }) => {
        const daySections = schedule.sections
          .filter((section) => section.days.includes(code))
          .sort((left, right) => left.startTime.localeCompare(right.startTime));
        return <DayColumn key={code} label={label} sections={daySections} />;
      })}
    </Stack>
  );
}
