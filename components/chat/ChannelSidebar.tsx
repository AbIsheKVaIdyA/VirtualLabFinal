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
    <aside className="border-b bg-card/70 p-3 lg:w-64 lg:border-b-0 lg:border-r lg:p-4">
      <div className="mb-3 lg:mb-5">
        <p className="text-sm font-semibold">{server?.name ?? "Server"}</p>
        <p className="hidden text-xs text-muted-foreground sm:block">Learning workspace</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:block lg:space-y-5">
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
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        {channels.map((channel) => {
          const Icon = channel.type === "voice" ? Mic2 : Hash;
          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => onSelect(channel.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors lg:w-full",
                activeChannelId === channel.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {channel.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
