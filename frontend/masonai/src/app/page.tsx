"use client";
import {
  Box,
  Button,
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
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import GroupIcon from "@mui/icons-material/Group";
import LightModeIcon from "@mui/icons-material/LightMode";
import SendIcon from "@mui/icons-material/Send";
import { useColorScheme } from "@mui/material/styles";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase";

interface Message {
  key?: number;
  role: string;
  content: string;
}

interface Chat {
  id: number;
  title: string;
  context: Message[];
}

const MODELS = ["Claude", "Gemini", "GPT"];
const TOP_BAR_CONTROL_WIDTH = 120;
const NEW_CHAT_TITLE = "New Chat";

function getNextChatTitle(chats: Chat[]) {
  const titles = chats.map((chat) => chat.title);
  let title = NEW_CHAT_TITLE;
  let number = 2;

  while (titles.includes(title)) {
    title = `${NEW_CHAT_TITLE} ${number}`;
    number += 1;
  }

  return title;
}

function ThemeToggleButton() {
  const { mode, setMode, systemMode } = useColorScheme();
  const activeMode = mode === "system" ? systemMode : mode;

  if (!activeMode) {
    return (
      <IconButton disabled sx={{ visibility: "hidden" }} tabIndex={-1} aria-hidden>
        <DarkModeIcon />
      </IconButton>
    );
  }

  const isDarkMode = activeMode === "dark";
  const nextMode = isDarkMode ? "light" : "dark";
  const buttonLabel = isDarkMode ? "Switch to light mode" : "Switch to dark mode";

  return (
    <IconButton aria-label={buttonLabel} onClick={() => setMode(nextMode)}>
      {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
}

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
        sx={{ width: TOP_BAR_CONTROL_WIDTH }}
      >
        {MODELS.map((name) => (
          <MenuItem key={name} value={name}>
            <Typography>{name}</Typography>
          </MenuItem>
        ))}
      </Select>
      <Typography variant="h6" sx={{ flexGrow: 1, textAlign: "center" }}>
        {title}
      </Typography>
      <Box sx={{ width: TOP_BAR_CONTROL_WIDTH, display: "flex", justifyContent: "flex-end" }}>
        <ThemeToggleButton />
      </Box>
    </Stack>
  );
}

function Sidebar({ chats, selected, onSelect, onAddChat }: {
  chats: Chat[];
  selected: number;
  onSelect: (index: number) => void;
  onAddChat: () => void;
}) {
  return (
    <Box sx={{
      width: 300,
      borderRight: 1,
      borderColor: "divider",
      py: 2,
      overflowY: "auto",
      flexShrink: 0,
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      "&::-webkit-scrollbar": { display: "none" }
    }}>
      <Stack spacing={0} sx={{ px: 1, pb: 1 }}>
        <Link href="/schedules" style={{ textDecoration: "none" }}>
          <Button
            variant="text"
            startIcon={<CalendarMonthIcon />}
            fullWidth
            sx={{ justifyContent: "flex-start", textTransform: "none", color: "text.primary" }}
          >
            <Typography>Schedule</Typography>
          </Button>
        </Link>
        <Button
          variant="text"
          startIcon={<GroupIcon />}
          sx={{ justifyContent: "flex-start", textTransform: "none", color: "text.primary" }}
        >
          <Typography>Social</Typography>
        </Button>
      </Stack>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, pb: 1 }}
      >
        <Typography variant="h6">Chats</Typography>
        <IconButton aria-label="Add new chat" size="small" onClick={onAddChat}>
          <AddIcon />
        </IconButton>
      </Stack>
      <List disablePadding>
        {chats.map((chat, i) => (
          <ListItemButton
            key={chat.id}
            selected={i === selected}
            onClick={() => onSelect(i)}
          >
            <ListItemText primary={chat.title} />
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
  const [chats, setChats] = useState<Chat[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [model, setModel] = useState<string>("Claude");
  const [selectedChat, setSelectedChat] = useState<number>(0);
  const chatListRef = useRef<HTMLUListElement | null>(null);
  const currentChat = chats[selectedChat];
  const selectedChatTitle = currentChat?.title ?? "";

  useEffect(() => {
    async function loadChats() {
      const { data, error } = await supabase
        .from("chats")
        .select("id, title, context")
        .order("last_edited", { ascending: false });

      if (error) {
        alert("Failed to load chats: " + error.message);
        return;
      }

      setChats(data as Chat[]);
      setSelectedChat(0);
    }

    loadChats();
  }, []);

  const contextWithLatest: Message[] = currentChat ? [...currentChat.context] : [];
  if (input.trim() && loading) {
    contextWithLatest.push({
      role: "user",
      content: `[USER] ${input}`
    });
  }

  const messagesToDisplay: Message[] = [];
  for (let i = 0; i < contextWithLatest.length; i++) {
    const message = contextWithLatest[i];
    let text = "";

    if (message.role === "system") {
      continue;
    }

    if (message.role === "assistant") {
      const command = JSON.parse(message.content);
      if (command["command"] !== "message") {
        continue;
      }

      text = command["contents"];

    } else {
      const msgSplit = message.content.split(" ");
      if (msgSplit[0] !== "[USER]") {
        continue;
      }

      text = msgSplit.slice(1).join(" ");
    }

    messagesToDisplay.push({
      key: i,
      role: message.role,
      content: text
    });
  }

  useLayoutEffect(() => {
    const chatListElement = chatListRef.current;
    if (!chatListElement) {
      return;
    }

    chatListElement.scrollTop = chatListElement.scrollHeight;
  }, [messagesToDisplay.length]);

  async function addChat() {
    const title = getNextChatTitle(chats);
    const { data, error } = await supabase
      .from("chats")
      .insert({ title, context: [], last_edited: new Date().toISOString() })
      .select("id, title, context")
      .single();

    if (error || !data) {
      console.error("Failed to create chat:", error);
      return;
    }

    setChats([data as Chat, ...chats]);
    setSelectedChat(0);
  }

  async function sendMessage() {
    if (!input.trim() || loading || !currentChat) return;

    setLoading(true);

    try {
      const isFirst = currentChat.context.length === 0;
      const response = await fetch(`http://localhost:5001${isFirst ? "/initial_msg" : "/msg"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isFirst ? {
          msg: input
        } : {
          context: currentChat.context,
          msg: input
        })
      });
      const data = await response.json();
      const newContext: Message[] = data.context;

      let newTitle: string | null = null;
      if (isFirst) {
        try {
          const titleResponse = await fetch("http://localhost:5001/title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ msg: input })
          });
          newTitle = (await titleResponse.json()).title;
        } catch (error) {
          alert(`Failed to generate chat title: ${error}`);
        }
      }

      setChats((prev) => prev.map((chat) => (
        chat.id === currentChat.id
          ? { ...chat, context: newContext, title: newTitle ?? chat.title }
          : chat
      )));

      const update: { context: Message[]; last_edited: string; title?: string } = {
        context: newContext,
        last_edited: new Date().toISOString()
      };
      if (newTitle) {
        update.title = newTitle;
      }

      const { error } = await supabase
        .from("chats")
        .update(update)
        .eq("id", currentChat.id);

      if (error) {
        alert("Failed to persist chat context: " + error.message);
      }

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
        chats={chats}
        selected={selectedChat}
        onSelect={setSelectedChat}
        onAddChat={addChat}
      />
      <Stack spacing={2} sx={{ flexGrow: 1, pt: 2, pb: 2 }}>
        <TopBar
          title={selectedChatTitle}
          model={model}
          onModelChange={setModel}
        />
        <List
          ref={chatListRef}
          sx={{
            px: 2,
            overflowY: "auto",
            flexGrow: 1,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": {
              display: "none"
            }
          }}
        >
          {messagesToDisplay.map((message) => (
            <MessageItem
              key={message.key}
              role={message.role}
              text={message.content}
            />
          ))}
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
