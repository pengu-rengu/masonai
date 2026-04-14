"use client";
import {
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Link from "next/link";
import { useEffect, useState } from "react";
import Schedule from "@/components/Schedule";
import SectionList from "@/components/SectionList";
import SectionSearch from "@/components/SectionSearch";
import {
  createSchedule,
  deleteSchedule,
  fetchSchedules,
  renameSchedule,
  updateScheduleSections,
  type ClassSection,
  type Schedule as ScheduleType
} from "@/lib/schedules";

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
  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const activeSchedule = schedules.find((schedule) => schedule.id === selectedId) ?? null;

  useEffect(() => {
    async function load() {
      const loaded = await fetchSchedules();
      setSchedules(loaded);
    }
    load();
  }, []);

  function patchSchedule(id: number, patch: Partial<ScheduleType>) {
    setSchedules((prev) => prev.map((schedule) => (
      schedule.id === id ? { ...schedule, ...patch } : schedule
    )));
  }

  async function handleAddSchedule() {
    const created = await createSchedule("Untitled");
    if (!created) return;
    setSchedules((prev) => [created, ...prev]);
    setSelectedId(created.id);
  }

  async function handleDeleteSchedule(id: number) {
    await deleteSchedule(id);
    setSchedules((prev) => prev.filter((schedule) => schedule.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }

  async function handleRename(id: number, title: string) {
    patchSchedule(id, { title });
    await renameSchedule(id, title);
  }

  async function handleSectionsChange(id: number, sections: ClassSection[]) {
    patchSchedule(id, { sections });
    await updateScheduleSections(id, sections);
  }

  function handleAddSection(section: ClassSection) {
    if (!activeSchedule) return;
    handleSectionsChange(activeSchedule.id, [...activeSchedule.sections, section]);
  }

  function handleDeleteSection(index: number) {
    if (!activeSchedule) return;
    const next = activeSchedule.sections.filter((_, sectionIndex) => sectionIndex !== index);
    handleSectionsChange(activeSchedule.id, next);
  }

  return (
    <Stack spacing={2} sx={{ height: "100vh", pt: 2, px: 2, pb: 2, overflow: "auto" }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        {activeSchedule ? (
          <BackButton onBack={() => setSelectedId(null)} />
        ) : (
          <BackButton href="/" />
        )}
        {activeSchedule ? (
          <>
            <Typography variant="h5">{activeSchedule.title}</Typography>
            <IconButton
              aria-label="Rename schedule"
              onClick={() => {
                const next = window.prompt("Rename schedule", activeSchedule.title);
                if (next && next !== activeSchedule.title) {
                  handleRename(activeSchedule.id, next);
                }
              }}
            >
              <EditIcon />
            </IconButton>
          </>
        ) : (
          <>
            <Typography variant="h5">Schedules</Typography>
            <IconButton aria-label="Add schedule" onClick={handleAddSchedule}>
              <AddIcon />
            </IconButton>
          </>
        )}
      </Stack>

      {activeSchedule ? (
        <Stack spacing={3}>
          <Schedule schedule={activeSchedule} />
          <SectionList
            sections={activeSchedule.sections}
            actionIcon={<DeleteIcon />}
            actionLabel="Delete section"
            onAction={handleDeleteSection}
          />
          <SectionSearch onAdd={handleAddSection} />
        </Stack>
      ) : (
        <List>
          {schedules.map((schedule) => (
            <ListItem
              key={schedule.id}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="Delete schedule"
                  onClick={() => handleDeleteSchedule(schedule.id)}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemButton onClick={() => setSelectedId(schedule.id)}>
                <ListItemText primary={schedule.title} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
}
