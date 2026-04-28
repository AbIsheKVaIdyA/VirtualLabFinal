"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import type { Message } from "@/lib/communication-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function MessageItem({ message }: { message: Message }) {
  const authorName = message.user?.name ?? "Student";
  const initials = authorName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="group flex gap-3 rounded-xl px-3 py-2 hover:bg-muted/40">
      <Avatar className="mt-1 size-9">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{authorName}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(message.createdAt).toLocaleString()}
          </p>
          {message.optimistic && (
            <span className="text-xs text-muted-foreground">sending...</span>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
          {message.content}
        </p>
      </div>
      <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" aria-label="Edit message placeholder">
          <Pencil className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Delete message placeholder">
          <Trash2 className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="More actions placeholder">
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
