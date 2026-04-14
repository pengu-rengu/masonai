"use client";
import {
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { useState } from "react";
import Schedule from "@/components/Schedule";
import { mockSchedules } from "@/lib/mockSchedules";

function BackButton({ onBack, href }: { onBack?: () => void; href?: string }) {
  if (href) {
    return (
      <Link href={href} aria-label="Back">
        <IconButton component="span">
          <ArrowBackIcon />
        </IconButton>
      </Link>
    );
  }

  return (
    <IconButton aria-label="Back" onClick={onBack}>
      <ArrowBackIcon />
    </IconButton>
  );
}

export default function SchedulesPage() {
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const activeSchedule = selectedSchedule === null ? null : mockSchedules[selectedSchedule];

  return (
    <Stack spacing={2} sx={{ height: "100vh", pt: 2, px: 2, pb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        {activeSchedule ? (
          <BackButton onBack={() => setSelectedSchedule(null)} />
        ) : (
          <BackButton href="/" />
        )}
        <Typography variant="h5">
          {activeSchedule ? activeSchedule.name : "Schedules"}
        </Typography>
      </Stack>
      {activeSchedule ? (
        <Schedule schedule={activeSchedule} />
      ) : (
        <List>
          {mockSchedules.map((schedule, index) => (
            <ListItemButton
              key={schedule.id}
              onClick={() => setSelectedSchedule(index)}
            >
              <ListItemText primary={schedule.name} />
            </ListItemButton>
          ))}
        </List>
      )}
    </Stack>
  );
}
