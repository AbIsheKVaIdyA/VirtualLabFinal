"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Radio, ShieldCheck, Users2 } from "lucide-react";

import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ServerSidebar } from "@/components/chat/ServerSidebar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
import { localChatSeed } from "@/store/chatStore";

export function CommunityWorkspace({
  showBackLink = false,
  className,
}: {
  showBackLink?: boolean;
  className?: string;
}) {
  const seed = localChatSeed;
  const { user: clerkUser } = useUser();
  const [activeServerId, setActiveServerId] = useState(seed.servers[0].id);
  const serverChannels = useMemo(
    () => seed.channels.filter((channel) => channel.serverId === activeServerId),
    [activeServerId, seed.channels]
  );
  const [activeChannelId, setActiveChannelId] = useState(serverChannels[0].id);
  const activeServer = seed.servers.find((server) => server.id === activeServerId);
  const activeChannel =
    serverChannels.find((channel) => channel.id === activeChannelId) ?? serverChannels[0];
  const currentUser = useMemo(
    () => ({
      id: clerkUser?.id ?? seed.users[0].id,
      name:
        clerkUser?.firstName ??
        clerkUser?.username ??
        clerkUser?.primaryEmailAddress?.emailAddress?.split("@")[0] ??
        seed.users[0].name,
    }),
    [
      clerkUser?.firstName,
      clerkUser?.id,
      clerkUser?.primaryEmailAddress?.emailAddress,
      clerkUser?.username,
      seed.users,
    ]
  );
  const onlineUsers = useMemo(
    () => [
      {
        ...seed.users[0],
        id: currentUser.id,
        name: currentUser.name,
      },
    ],
    [currentUser.id, currentUser.name, seed.users]
  );
  const initialMessages = useMemo(
    () => seed.messages.filter((message) => message.channelId === activeChannel.id),
    [activeChannel.id, seed.messages]
  );
  const voiceChannels = seed.channels.filter((channel) => channel.type === "voice");

  return (
    <section className={cn("flex min-h-[calc(100vh-7rem)] flex-col gap-3", className)}>
      <header className="rounded-2xl border border-white/10 bg-[#08080a]/95 px-4 py-3 text-[#f6f1e8] shadow-2xl shadow-black/35 sm:rounded-3xl sm:px-5 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#d6d0c6]/45">
              Community
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              {activeServer?.name ?? "Virtual Lab"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant={isSupabaseConfigured ? "default" : "secondary"}>
              {isSupabaseConfigured ? "Realtime ready" : "Local mode"}
            </Badge>
            <Badge className="bg-white/10 text-[#f6f1e8] hover:bg-white/10">
              #{activeChannel.name}
            </Badge>
            {showBackLink && (
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
                Back to Dashboard
              </Link>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4">
          {[
            { label: "Channels", value: seed.channels.length, icon: Radio },
            { label: "Online", value: onlineUsers.length, icon: Users2 },
            { label: "Moderation", value: "On", icon: ShieldCheck },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 sm:rounded-2xl sm:px-4 sm:py-3">
              <p className="flex items-center gap-1.5 text-[0.68rem] text-[#d6d0c6]/55 sm:gap-2 sm:text-xs">
                <Icon className="size-3.5 text-blue-300" />
                {label}
              </p>
              <p className="mt-1 text-base font-semibold sm:text-xl">{value}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="grid flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-h-[680px] overflow-hidden rounded-2xl border border-white/10 bg-[#070709] shadow-2xl shadow-black/30 sm:min-h-[780px] sm:rounded-3xl lg:grid-cols-[80px_270px_1fr]">
          <ServerSidebar
            servers={seed.servers}
            activeServerId={activeServerId}
            onSelect={(serverId) => {
              setActiveServerId(serverId);
              const nextChannel = seed.channels.find((channel) => channel.serverId === serverId);
              if (nextChannel) setActiveChannelId(nextChannel.id);
            }}
          />
          <ChannelSidebar
            server={activeServer}
            channels={serverChannels}
            activeChannelId={activeChannel.id}
            onSelect={setActiveChannelId}
          />
          <main className="min-h-0 p-3 sm:p-4">
            <ChatWindow
              tenantId={seed.tenant.id}
              activeChannel={activeChannel}
              currentUser={currentUser}
              initialMessages={initialMessages}
            />
          </main>
        </div>

        <aside className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 xl:grid-rows-[1fr_auto]">
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0e] p-4 text-[#f6f1e8] sm:rounded-3xl sm:p-5">
            <p className="text-sm font-semibold">Online Now</p>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1 md:block md:space-y-3 md:overflow-visible md:pb-0">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex min-w-52 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:min-w-0"
                >
                  <span className="grid size-9 place-items-center rounded-full bg-[#b11226]/25 text-sm font-semibold">
                    {user.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="text-xs capitalize text-[#d6d0c6]/55">{user.role}</p>
                  </div>
                  <span className="ml-auto size-2 rounded-full bg-green-400" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0e] p-4 text-[#f6f1e8] sm:rounded-3xl sm:p-5">
            <p className="text-sm font-semibold">Voice Rooms</p>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 md:block md:space-y-2 md:overflow-visible md:pb-0">
              {voiceChannels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  className="flex min-w-48 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06] md:w-full md:min-w-0"
                >
                  <span>{channel.name}</span>
                  <Radio className="size-4 text-blue-300" />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
