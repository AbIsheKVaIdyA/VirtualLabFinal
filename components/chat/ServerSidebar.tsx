"use client";

import type { Server } from "@/lib/communication-types";
import { cn } from "@/lib/utils";

export function ServerSidebar({
  servers,
  activeServerId,
  onSelect,
}: {
  servers: Server[];
  activeServerId: string;
  onSelect: (serverId: string) => void;
}) {
  return (
    <aside className="flex gap-3 overflow-x-auto border-b bg-background/80 p-3 lg:w-20 lg:flex-col lg:items-center lg:overflow-visible lg:border-b-0 lg:border-r">
      {servers.map((server) => (
        <button
          key={server.id}
          type="button"
          onClick={() => onSelect(server.id)}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold transition-all lg:size-12",
            activeServerId === server.id
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
          )}
          aria-label={server.name}
        >
          {server.icon ?? server.name.slice(0, 2).toUpperCase()}
        </button>
      ))}
    </aside>
  );
}
