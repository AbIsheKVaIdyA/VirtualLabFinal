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
    <aside className="flex gap-3 overflow-x-auto border-b border-white/10 bg-black/35 p-3 lg:w-20 lg:flex-col lg:items-center lg:overflow-visible lg:border-b-0 lg:border-r">
      {servers.map((server) => (
        <button
          key={server.id}
          type="button"
          onClick={() => onSelect(server.id)}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold shadow-lg transition-all lg:size-12",
            activeServerId === server.id
              ? "border-[#b11226] bg-[#b11226] text-white shadow-[#b11226]/20"
              : "border-white/10 bg-white/[0.04] text-white/60 hover:border-[#b11226]/50 hover:bg-white/[0.08] hover:text-white"
          )}
          aria-label={server.name}
        >
          {server.icon ?? server.name.slice(0, 2).toUpperCase()}
        </button>
      ))}
    </aside>
  );
}
