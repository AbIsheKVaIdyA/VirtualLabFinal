"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Mic2, Radio, ShieldCheck, Users2 } from "lucide-react";

import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ServerSidebar } from "@/components/chat/ServerSidebar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-visible",
        className
      )}
    >
      <header className="overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_0%_0%,rgba(177,18,38,0.28),transparent_34%),linear-gradient(135deg,#121217_0%,#08080a_55%,#030304_100%)] px-4 py-4 text-[#f6f1e8] shadow-2xl shadow-black/40 sm:rounded-3xl sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              {activeServer?.name ?? "UpSkillr"}
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-[#d6d0c6]/55 sm:text-sm">
              Course channels, voice rooms, and live study conversations in one workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge className="bg-white/10 text-[#f6f1e8] hover:bg-white/10">
              #{activeChannel.name}
            </Badge>
            {showBackLink && (
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full justify-center sm:inline-flex sm:w-auto"
                )}
              >
                Back to Dashboard
              </Link>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Channels", value: seed.channels.length, icon: Radio },
            { label: "Online", value: onlineUsers.length, icon: Users2 },
            { label: "Moderation", value: "On", icon: ShieldCheck },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 backdrop-blur sm:rounded-2xl sm:px-4 sm:py-3">
              <p className="flex items-center gap-1.5 text-[0.68rem] text-[#d6d0c6]/55 sm:gap-2 sm:text-xs">
                <Icon className="size-3.5 text-blue-300" />
                {label}
              </p>
              <p className="mt-1 text-base font-semibold sm:text-xl">{value}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="grid min-h-0 min-w-0 flex-1 gap-3 overflow-x-hidden lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-h-[420px] min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#08080a_0%,#050506_100%)] shadow-2xl shadow-black/35 sm:rounded-3xl md:min-h-[min(calc(100dvh-10rem),900px)] md:grid-cols-[80px_288px_minmax(0,1fr)] lg:grid-cols-[80px_290px_minmax(0,1fr)]">
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
          <main className="min-h-0 bg-[#050506] p-3 sm:p-4">
            <ChatWindow
              tenantId={seed.tenant.id}
              activeChannel={activeChannel}
              currentUser={currentUser}
              initialMessages={initialMessages}
            />
          </main>
        </div>

        <aside className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 xl:grid-rows-[1fr_auto]">
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0e] p-4 text-[#f6f1e8] shadow-xl shadow-black/20 sm:rounded-3xl sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Online Now</p>
              <Badge className="bg-green-500/15 text-green-100 hover:bg-green-500/15">
                Live
              </Badge>
            </div>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1 md:block md:space-y-3 md:overflow-visible md:pb-0">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex min-w-52 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-colors hover:bg-white/[0.07] md:min-w-0"
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
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0e] p-4 text-[#f6f1e8] shadow-xl shadow-black/20 sm:rounded-3xl sm:p-5">
            <p className="text-sm font-semibold">Voice Rooms</p>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 md:block md:space-y-2 md:overflow-visible md:pb-0">
              {voiceChannels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => setActiveChannelId(channel.id)}
                  className="flex min-w-48 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.08] md:w-full md:min-w-0"
                >
                  <span className="flex items-center gap-2">
                    <Mic2 className="size-4 text-blue-300" />
                    {channel.name}
                  </span>
                  <Radio className="size-4 text-[#b11226]" />
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-[#d6d0c6]/60">
              Select a voice room to join with your microphone.
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
