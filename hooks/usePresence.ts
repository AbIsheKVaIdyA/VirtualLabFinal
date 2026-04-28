"use client";

import { useEffect, useState } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase-client";

type PresenceUser = {
  id: string;
  name: string;
  onlineAt: string;
};

export function usePresence(input: {
  tenantId: string;
  channelId: string;
  user: { id: string; name: string };
}) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      queueMicrotask(() =>
        setOnlineUsers([
          {
            id: input.user.id,
            name: input.user.name,
            onlineAt: new Date().toISOString(),
          },
        ])
      );
      return;
    }

    const client = supabase;
    const channel = client.channel(`presence:${input.tenantId}:${input.channelId}`, {
      config: {
        presence: {
          key: input.user.id,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        setOnlineUsers(Object.values(state).flat());
      })
      .on("broadcast", { event: "typing" }, () => {
        setIsTyping(true);
        window.setTimeout(() => setIsTyping(false), 1400);
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        await channel.track({
          id: input.user.id,
          name: input.user.name,
          onlineAt: new Date().toISOString(),
        });
      });

    return () => {
      void client.removeChannel(channel);
    };
  }, [input.channelId, input.tenantId, input.user.id, input.user.name]);

  const sendTyping = () => {
    if (!isSupabaseConfigured || !supabase) return;
    void supabase
      .channel(`presence:${input.tenantId}:${input.channelId}`)
      .send({ type: "broadcast", event: "typing", payload: { userId: input.user.id } });
  };

  return {
    onlineUsers,
    isTyping,
    sendTyping,
  };
}
