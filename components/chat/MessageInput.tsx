"use client";

import { FormEvent, useState } from "react";
import { SendHorizonal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MessageInput({
  channelName,
  onSend,
  onTyping,
}: {
  channelName: string;
  onSend: (content: string) => void;
  onTyping?: () => void;
}) {
  const [content, setContent] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setContent("");
  };

  return (
    <form onSubmit={submit} className="flex gap-2 rounded-2xl border bg-card p-2">
      <Input
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          onTyping?.();
        }}
        placeholder={`Message #${channelName}`}
        className="min-w-0 border-0 bg-transparent text-sm focus-visible:ring-0"
      />
      <Button type="submit" size="icon" aria-label="Send message">
        <SendHorizonal className="size-4" />
      </Button>
    </form>
  );
}
