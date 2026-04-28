"use client";

import { useEffect, useMemo, useState } from "react";

import type { Message } from "@/lib/communication-types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase-client";

function mapMessage(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    channelId: String(row.channel_id),
    userId: String(row.user_id),
    content: String(row.content),
    createdAt: String(row.created_at),
    editedAt: row.edited_at ? String(row.edited_at) : null,
    deletedAt: row.deleted_at ? String(row.deleted_at) : null,
  };
}

export function useRealtimeMessages(input: {
  tenantId: string;
  channelId: string;
  initialMessages?: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(input.initialMessages ?? []);
  const [isRealtime, setIsRealtime] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMessages(input.initialMessages ?? []));
  }, [input.channelId, input.initialMessages]);

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
        setMessages(data.map((row) => mapMessage(row)));
      });

    const channel = client
      .channel(`messages:${input.tenantId}:${input.channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${input.channelId}`,
        },
        (payload) => {
          setMessages((current) => [...current, mapMessage(payload.new)]);
        }
      )
      .subscribe((status) => {
        setIsRealtime(status === "SUBSCRIBED");
      });

    return () => {
      mounted = false;
      void client.removeChannel(channel);
    };
  }, [input.channelId, input.tenantId]);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [messages]
  );

  return {
    messages: sortedMessages,
    setMessages,
    isRealtime,
    isSupabaseConfigured,
  };
}
