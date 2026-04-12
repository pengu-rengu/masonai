"use client";
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: string;
  content: string;
}

const MODELS = ["Claude", "Gemini", "GPT"];

const PLACEHOLDER_CHATS = [
  "CS 101 Homework Help",
  "Library Hours",
  "Campus Parking Info",
  "Financial Aid Questions",
  "MATH 214 Study Group",
  "Dorm Move-In Info",
  "Career Fair Prep",
  "ENGR 107 Lab Report",
  "Shuttle Schedule",
  "Club Registration",
  "Advising Appointment",
  "PSYC 100 Essay Draft",
  "Meal Plan Options",
  "Gym Hours",
  "Graduation Requirements",
  "Research Assistant Role",
  "PHYS 160 Exam Review",
  "Transfer Credits"
];

function TopBar({ title, model, onModelChange }: {
  title: string;
  model: string;
  onModelChange: (model: string) => void;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{ px: 2, py: 1 }}
    >
      <Select
        size="small"
        value={model}
        onChange={(event) => onModelChange(event.target.value)}
        sx={{ minWidth: 120 }}
      >
        {MODELS.map((name) => (
          <MenuItem key={name} value={name}>{name}</MenuItem>
        ))}
      </Select>
      <Typography variant="h6" sx={{ flexGrow: 1, textAlign: "center" }}>
        {title}
      </Typography>
      <Box sx={{ minWidth: 120 }} />
    </Stack>
  );
}

function Sidebar({ chats, selected, onSelect }: {
  chats: string[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  return (
    <Box sx={{
      width: 260,
      borderRight: 1,
      borderColor: "divider",
      py: 2,
      overflowY: "auto",
      flexShrink: 0,
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      "&::-webkit-scrollbar": { display: "none" }
    }}>
      <Typography variant="h6" sx={{ px: 2, pb: 2 }}>Chats</Typography>
      <List disablePadding>
        {chats.map((chat, i) => (
          <ListItemButton
            key={i}
            selected={i === selected}
            onClick={() => onSelect(i)}
          >
            <ListItemText primary={chat} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

function ChatInput({ input, loading, onInputChange, onSend }: {
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 2 }}>
      <TextField
        fullWidth
        maxRows={3}
        value={loading ? "" : input}
        disabled={loading}
        placeholder={loading ? "Generating..." : ""}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onSend();
          }
        }}
        onChange={(event) => onInputChange(event.target.value)}
      />
      <IconButton
        sx={{ p: 2 }}
        disabled={loading}
        onClick={onSend}
      >
        <SendIcon />
      </IconButton>
    </Stack>
  );
}

function MessageItem({ role, text }: {
  role: Message["role"];
  text: string;
}) {
  const isUser = role === "user";

  return (
    <ListItem
      disableGutters
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        py: 1
      }}
    >
      {isUser ? (
        <Box
          sx={{
            px: 2,
            py: 2,
            borderRadius: 3,
            borderBottomRightRadius: 1,
            bgcolor: "primary.main",
            color: "primary.contrastText"
          }}
        >
          <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {text}
          </Typography>
        </Box>
      ) : (
        <Box>
          <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
        </Box>
      )}
    </ListItem>
  );
}

export default function Home() {
  const [context, setContext] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [model, setModel] = useState<string>("Claude");
  const [selectedChat, setSelectedChat] = useState<number>(0);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    setLoading(true);

    try {
      const isFirst = context.length === 0;
      const response = await fetch(`http://localhost:5001${isFirst ? "/initial_msg" : "/msg"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isFirst ? {
          msg: input
        } : {
          context: context,
          msg: input
        })
      });
      const data = await response.json();
      setContext(data.context);

    } catch (err) {
      console.error("Failed to send message:", err);

    } finally {
      setInput("");
      setLoading(false);
    }
  }

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Sidebar
        chats={PLACEHOLDER_CHATS}
        selected={selectedChat}
        onSelect={setSelectedChat}
      />
      <Stack spacing={2} sx={{ flexGrow: 1, pt: 2, pb: 2 }}>
        <TopBar
          title={PLACEHOLDER_CHATS[selectedChat]}
          model={model}
          onModelChange={setModel}
        />
        <List sx={{
          px: 2,
          overflowY: "auto",
          flexGrow: 1,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": {
            display: "none"
          }
        }}>
          {(() => {
            const items: React.ReactNode[] = [];

            const contextToDisplay = [...context];
            if (input.trim() && loading) {
              contextToDisplay.push({
                "role": "user",
                "content": `[USER] ${input}`
              });
            }

            for (let i = 0; i < contextToDisplay.length; i++) {
              const message = contextToDisplay[i];
              let text = "";
              if (message.role === "system") {
                continue;

              } else if (message.role === "assistant") {
                const command = JSON.parse(message.content);
                if (command["command"] === "message") {
                  text = command["contents"];
                } else {
                  continue;
                }

              } else {
                const msgSplit = message.content.split(" ");
                if (msgSplit[0] === "[USER]") {
                  text = msgSplit.slice(1).join(" ");
                } else {
                  continue;
                }
              }

              items.push(
                <MessageItem
                  key={i}
                  role={message.role}
                  text={text}
                />
              );
            }

            return items;
          })()}
        </List>
        <ChatInput
          input={input}
          loading={loading}
          onInputChange={setInput}
          onSend={sendMessage}
        />
      </Stack>
    </Box>
  );
}
