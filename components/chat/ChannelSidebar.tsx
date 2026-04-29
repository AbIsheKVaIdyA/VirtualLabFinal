"use client";

import { Hash, Mic2 } from "lucide-react";

import type { Channel, Server } from "@/lib/communication-types";
import { cn } from "@/lib/utils";

export function ChannelSidebar({
  server,
  channels,
  activeChannelId,
  onSelect,
}: {
  server?: Server;
  channels: Channel[];
  activeChannelId: string;
  onSelect: (channelId: string) => void;
}) {
  return (
    <aside className="border-b border-white/10 bg-[#0b0b0e] p-3 text-[#f6f1e8] md:w-72 md:flex-shrink-0 md:border-b-0 md:border-r md:p-4">
      <div className="mb-3 lg:mb-5">
        <p className="text-base font-semibold">{server?.name ?? "Server"}</p>
        <p className="hidden text-xs text-[#d6d0c6]/55 sm:block">Learning workspace</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:block md:space-y-5">
        <ChannelGroup
          title="Text Channels"
          channels={channels.filter((channel) => channel.type === "text")}
          activeChannelId={activeChannelId}
          onSelect={onSelect}
        />
        <ChannelGroup
          title="Voice Channels"
          channels={channels.filter((channel) => channel.type === "voice")}
          activeChannelId={activeChannelId}
          onSelect={onSelect}
        />
      </div>
    </aside>
  );
}

function ChannelGroup({
  title,
  channels,
  activeChannelId,
  onSelect,
}: {
  title: string;
  channels: Channel[];
  activeChannelId: string;
  onSelect: (channelId: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#d6d0c6]/45">
        {title}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 md:block md:space-y-1 md:overflow-visible md:pb-0">
        {channels.map((channel) => {
          const Icon = channel.type === "voice" ? Mic2 : Hash;
          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => onSelect(channel.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors md:w-full",
                activeChannelId === channel.id
                  ? "bg-[#b11226] text-white shadow-lg shadow-[#b11226]/15"
                  : "text-[#d6d0c6]/65 hover:bg-white/[0.06] hover:text-[#f6f1e8]"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{channel.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
