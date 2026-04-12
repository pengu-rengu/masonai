"use client";
import { Box, IconButton, List, ListItem, Stack, TextField, Typography } from '@mui/material';
import SendIcon from "@mui/icons-material/Send";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: string;
  content: string;
}

interface MessageItemProps {
  role: Message["role"];
  text: string;
  messageMaxWidth: {
    xs: string;
    sm: string;
    md: string;
  };
}

function MessageItem({ role, text, messageMaxWidth }: MessageItemProps) {
  const isUser = role === "user";

  return (
    <ListItem
      disableGutters
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        alignItems: "flex-start",
        py: 0.75,
      }}
    >
      {isUser ? (
        <Box
          sx={{
            maxWidth: messageMaxWidth,
            minWidth: 0,
            px: 2,
            py: 1.25,
            borderRadius: 3,
            borderBottomRightRadius: 1,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            boxShadow: 1,
          }}
        >
          <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {text}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            width: messageMaxWidth,
            minWidth: 0,
            color: "text.primary",
            wordBreak: "break-word",
            "& > :first-of-type": { mt: 0 },
            "& > :last-child": { mb: 0 },
            "& p": { my: 0 },
            "& ul, & ol": { my: 1, pl: 3 },
            "& pre": {
              overflowX: "auto",
              p: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(255, 255, 255, 0.06)",
            },
            "& code": {
              fontFamily: "monospace",
            },
          }}
        >
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
  const messageMaxWidth = { xs: "85%", sm: "78%", md: "70%" };

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
    <Stack spacing={2} sx={{ height: '100vh', width: "80vw", pt: 2, pb: 2, mx: 'auto' }}>
      <List sx={{
        pl: 2,
        pr: 2,
        overflowY: 'auto', 
        flexGrow: 1,
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE and Edge
        '&::-webkit-scrollbar': {
          display: 'none', // Chrome, Safari and Opera
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
              const msg_split = message.content.split(" ");
              if (msg_split[0] === "[USER]") {
                text = msg_split.slice(1).join(" ");
              } else {
                continue
              }

            }
            
            items.push(
              <MessageItem
                key={i}
                role={message.role}
                text={text}
                messageMaxWidth={messageMaxWidth}
              />
            );
          }

          return items;
         })()}
      </List>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          fullWidth
          maxRows={3}
          value={loading ? "" : input}
          disabled={loading}
          placeholder={loading ? "Generating..." : ""}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              sendMessage();
            }
          }}
          onChange={(event) => setInput(event.target.value)}
        />
        <IconButton
          sx={{ p: 2 }}
          disabled={loading}
          onClick={sendMessage}
        >
          <SendIcon />
        </IconButton>
      </Stack>
      
    </Stack>
  );
}
