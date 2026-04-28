"use client";

import { useEffect, useMemo, useState } from "react";

import type { Message } from "@/lib/communication-types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase-client";
import { useChatMessageStore } from "@/store/chatStore";

function mapMessage(row: Record<string, unknown>): Message {
  const authorName = row.author_name ? String(row.author_name) : "Student";

  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    channelId: String(row.channel_id),
    userId: String(row.user_id),
    content: String(row.content),
    createdAt: String(row.created_at),
    editedAt: row.edited_at ? String(row.edited_at) : null,
    deletedAt: row.deleted_at ? String(row.deleted_at) : null,
    user: {
      id: String(row.user_id),
      name: authorName,
      role: "user",
    },
  };
}

export function useRealtimeMessages(input: {
  tenantId: string;
  channelId: string;
  initialMessages?: Message[];
}) {
  const [isRealtime, setIsRealtime] = useState(false);
  const messages = useChatMessageStore(
    (state) => state.messagesByChannel[input.channelId] ?? input.initialMessages ?? []
  );
  const initializeChannel = useChatMessageStore((state) => state.initializeChannel);
  const setChannelMessages = useChatMessageStore((state) => state.setChannelMessages);
  const upsertMessage = useChatMessageStore((state) => state.upsertMessage);
  const removeMessage = useChatMessageStore((state) => state.removeMessage);

  useEffect(() => {
    initializeChannel(input.channelId, input.initialMessages ?? []);
    queueMicrotask(() => setIsRealtime(false));
  }, [initializeChannel, input.channelId, input.initialMessages]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;

    let mounted = true;

    client
      .from("messages")
      .select("*")
      .eq("tenant_id", input.tenantId)
      .eq("channel_id", input.channelId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (!mounted || !data) return;
        setChannelMessages(input.channelId, data.map((row) => mapMessage(row)));
      });

    const channel = client
      .channel(`messages:${input.tenantId}:${input.channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${input.channelId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            removeMessage(input.channelId, String(payload.old.id));
            return;
          }

          const nextMessage = mapMessage(payload.new);
          if (nextMessage.deletedAt) {
            removeMessage(input.channelId, nextMessage.id);
            return;
          }

          upsertMessage(input.channelId, nextMessage);
        }
      )
      .subscribe((status) => {
        setIsRealtime(status === "SUBSCRIBED");
      });

    return () => {
      mounted = false;
      void client.removeChannel(channel);
    };
  }, [input.channelId, input.tenantId, removeMessage, setChannelMessages, upsertMessage]);

  const sortedMessages = useMemo(
    () =>
      messages.filter((message) => !message.deletedAt).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [messages]
  );

  return {
    messages: sortedMessages,
    isRealtime,
    isSupabaseConfigured,
  };
}
