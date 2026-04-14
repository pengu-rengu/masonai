"use client";
import type { ReactNode } from "react";
import {
  IconButton,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import { formatTime, type ClassSection } from "@/lib/schedules";

function sectionSummary(section: ClassSection) {
  return `${section.days} ${formatTime(section.startTime)}-${formatTime(section.endTime)} · ${section.building} ${section.room} · ${section.instructor}`;
}

export default function SectionList({
  sections,
  actionIcon,
  actionLabel,
  onAction
}: {
  sections: ClassSection[];
  actionIcon: ReactNode;
  actionLabel: string;
  onAction: (index: number) => void;
}) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <List dense>
      {sections.map((section, index) => (
        <ListItem
          key={`${section.title}-${section.startTime}-${index}`}
          secondaryAction={
            <IconButton edge="end" aria-label={actionLabel} onClick={() => onAction(index)}>
              {actionIcon}
            </IconButton>
          }
        >
          <ListItemText primary={section.title} secondary={sectionSummary(section)} />
        </ListItem>
      ))}
    </List>
  );
}
