"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { Message } from "@/lib/communication-types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase-client";

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
  const [messages, setMessages] = useState<Message[]>(input.initialMessages ?? []);
  const [isRealtime, setIsRealtime] = useState(false);
  const initialMessagesRef = useRef(input.initialMessages ?? []);

  useEffect(() => {
    initialMessagesRef.current = input.initialMessages ?? [];
  }, [input.initialMessages]);

  useEffect(() => {
    queueMicrotask(() => {
      setMessages(initialMessagesRef.current);
      setIsRealtime(false);
    });
  }, [input.channelId]);

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
          const nextMessage = mapMessage(payload.new);
          setMessages((current) =>
            current.some((message) => message.id === nextMessage.id)
              ? current.map((message) =>
                  message.id === nextMessage.id ? nextMessage : message
                )
              : [...current, nextMessage]
          );
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
