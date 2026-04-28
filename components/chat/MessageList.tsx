"use client";

import type { Message } from "@/lib/communication-types";
import { MessageItem } from "@/components/chat/MessageItem";

export function MessageList({ messages }: { messages: Message[] }) {
  if (!messages.length) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
        No messages yet. Start the conversation.
      </div>
    );
  }

  return (
    <div className="space-y-1 overflow-y-auto pr-2">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}
