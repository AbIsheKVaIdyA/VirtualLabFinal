"use client";

import { Hash, Radio } from "lucide-react";

import type { Channel, Message } from "@/lib/communication-types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase-client";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { VoicePanel } from "@/components/voice/VoicePanel";
import { usePresence } from "@/hooks/usePresence";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { moderateMessage } from "@/services/aiModeration";
import { createOptimisticMessage } from "@/store/chatStore";

export function ChatWindow({
  tenantId,
  activeChannel,
  currentUser,
  initialMessages,
}: {
  tenantId: string;
  activeChannel: Channel;
  currentUser: { id: string; name: string };
  initialMessages: Message[];
}) {
  const { messages, setMessages, isRealtime } = useRealtimeMessages({
    tenantId,
    channelId: activeChannel.id,
    initialMessages,
  });
  const presence = usePresence({
    tenantId,
    channelId: activeChannel.id,
    user: currentUser,
  });

  if (activeChannel.type === "voice") {
    return <VoicePanel channel={activeChannel} />;
  }

  const sendMessage = async (content: string) => {
    const moderation = moderateMessage(content);
    if (moderation.action === "delete") return;

    const optimistic = createOptimisticMessage({
      tenantId,
      channelId: activeChannel.id,
      userId: currentUser.id,
      userName: currentUser.name,
      content,
    });

    setMessages((current) => [...current, optimistic]);

    if (!isSupabaseConfigured || !supabase) return;

    const { error } = await supabase.from("messages").insert({
      tenant_id: tenantId,
      channel_id: activeChannel.id,
      user_id: currentUser.id,
      content,
    });

    if (error) {
      setMessages((current) =>
        current.map((message) =>
          message.id === optimistic.id ? { ...message, optimistic: false } : message
        )
      );
    }
  };

  return (
    <section className="flex h-full min-h-[560px] flex-col rounded-2xl border bg-card sm:min-h-[680px]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-2">
          <Hash className="size-5 text-primary" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{activeChannel.name}</p>
            <p className="text-xs text-muted-foreground">
              {isRealtime ? "Realtime connected" : "Local mode until Supabase is configured"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Radio className="size-3.5" />
          {presence.onlineUsers.length} online
          {presence.isTyping && <span>• typing...</span>}
        </div>
      </header>
      <div className="flex-1 overflow-hidden p-3 sm:p-4">
        <MessageList messages={messages} />
      </div>
      <div className="border-t p-3 sm:p-4">
        <MessageInput
          channelName={activeChannel.name}
          onSend={sendMessage}
          onTyping={presence.sendTyping}
        />
      </div>
    </section>
  );
}
