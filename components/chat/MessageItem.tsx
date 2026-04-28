"use client";

import { FormEvent, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

import type { Message } from "@/lib/communication-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function MessageItem({
  message,
  canManage,
  onEdit,
  onDelete,
}: {
  message: Message;
  canManage: boolean;
  onEdit: (message: Message, content: string) => void;
  onDelete: (message: Message) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const authorName = message.user?.name ?? "Student";
  const initials = authorName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const submitEdit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || trimmed === message.content) {
      setEditing(false);
      setDraft(message.content);
      return;
    }

    onEdit(message, trimmed);
    setEditing(false);
  };

  return (
    <div className="group flex gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-muted/40">
      <Avatar className="mt-1 size-9">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{authorName}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(message.createdAt).toLocaleString()}
          </p>
          {message.editedAt && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
          {message.optimistic && (
            <span className="text-xs text-muted-foreground">sending...</span>
          )}
        </div>
        {editing ? (
          <form onSubmit={submitEdit} className="mt-2 space-y-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-20 w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none ring-0 transition focus:border-primary"
              autoFocus
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" size="sm" className="gap-2">
                <Check className="size-3.5" />
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setDraft(message.content);
                  setEditing(false);
                }}
              >
                <X className="size-3.5" />
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
            {message.content}
          </p>
        )}
      </div>
      {canManage && !editing && (
        <div className="flex opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit message"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete message"
            onClick={() => onDelete(message)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
