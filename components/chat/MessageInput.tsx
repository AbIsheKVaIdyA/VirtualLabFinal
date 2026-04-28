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
    <form onSubmit={submit} className="flex gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 shadow-inner">
      <Input
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          onTyping?.();
        }}
        placeholder={`Message #${channelName}`}
        className="min-w-0 border-0 bg-transparent text-sm text-[#f6f1e8] placeholder:text-[#d6d0c6]/40 focus-visible:ring-0"
      />
      <Button type="submit" size="icon" aria-label="Send message" className="bg-[#b11226] text-white hover:bg-[#8f0e1f]">
        <SendHorizonal className="size-4" />
      </Button>
    </form>
  );
}
