"use client";
import { IconButton, List, ListItem, ListItemText, Stack, TextField } from '@mui/material';
import SendIcon from "@mui/icons-material/Send";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: string;
  content: string;
}

export default function Home() {
  const [context, setContext] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

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
          let items: React.ReactNode[] = [];

          let contextToDisplay = [...context];
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
              let msg_split = message.content.split(" ");
              if (msg_split[0] === "[USER]") {
                text = msg_split.slice(1).join(" ");
              } else {
                continue
              }

            }
            
            items.push(
              <ListItem key={i} sx={message.role !== "user" ? { display: 'block' } : {}}>
                {message.role == "user" ?
                <ListItemText primary={text} /> :
                <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>}
              </ListItem>
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
            if (event.key == "Enter") {
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