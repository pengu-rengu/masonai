import { supabase } from "@/lib/supabase";

export interface Message {
  key?: number;
  role: string;
  content: string;
}

export interface Chat {
  id: number;
  title: string;
  context: Message[];
}

function nowIso() {
  return new Date().toISOString();
}

export async function fetchChats(): Promise<Chat[]> {
  const { data, error } = await supabase
    .from("chats")
    .select("id, title, context")
    .order("last_edited", { ascending: false });

  if (error) {
    alert("Failed to load chats: " + error.message);
    return [];
  }

  return data as Chat[];
}

export async function createChat(title: string): Promise<Chat | null> {
  const { data, error } = await supabase
    .from("chats")
    .insert({ title, context: [], last_edited: nowIso() })
    .select("id, title, context")
    .single();

  if (error || !data) {
    alert("Failed to create chat: " + error?.message);
    return null;
  }

  return data as Chat;
}

export async function updateChatContext(id: number, context: Message[], title?: string) {
  const update: { context: Message[]; last_edited: string; title?: string } = {
    context,
    last_edited: nowIso()
  };
  if (title) {
    update.title = title;
  }

  const { error } = await supabase
    .from("chats")
    .update(update)
    .eq("id", id);

  if (error) {
    alert("Failed to persist chat context: " + error.message);
  }
}

export async function renameChat(id: number, title: string) {
  const { error } = await supabase
    .from("chats")
    .update({ title, last_edited: nowIso() })
    .eq("id", id);

  if (error) {
    alert("Failed to rename chat: " + error.message);
  }
}

export async function deleteChat(id: number) {
  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Failed to delete chat: " + error.message);
  }
}
