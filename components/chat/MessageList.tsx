"use client";

import type { Message } from "@/lib/communication-types";
import { MessageItem } from "@/components/chat/MessageItem";

export function MessageList({
  messages,
  currentUserId,
  onEdit,
  onDelete,
}: {
  messages: Message[];
  currentUserId: string;
  onEdit: (message: Message, content: string) => void;
  onDelete: (message: Message) => void;
}) {
  if (!messages.length) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.025] text-sm text-[#d6d0c6]/60">
        <div className="text-center">
          <p className="font-medium text-[#f6f1e8]">No messages yet</p>
          <p className="mt-1 text-xs">Start the conversation in this room.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-1 overflow-y-auto pr-2">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          canManage={message.userId === currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
