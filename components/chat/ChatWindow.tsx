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
import { createOptimisticMessage, useChatMessageStore } from "@/store/chatStore";

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
  const { messages, isRealtime } = useRealtimeMessages({
    tenantId,
    channelId: activeChannel.id,
    initialMessages,
  });
  const upsertMessage = useChatMessageStore((state) => state.upsertMessage);
  const updateMessage = useChatMessageStore((state) => state.updateMessage);
  const removeMessage = useChatMessageStore((state) => state.removeMessage);
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

    upsertMessage(activeChannel.id, optimistic);

    if (!isSupabaseConfigured || !supabase) return;

    const { error } = await supabase.from("messages").insert({
      id: optimistic.id,
      tenant_id: tenantId,
      channel_id: activeChannel.id,
      user_id: currentUser.id,
      author_name: currentUser.name,
      content,
    });

    if (error) {
      updateMessage(activeChannel.id, optimistic.id, { optimistic: false });
      return;
    }

    updateMessage(activeChannel.id, optimistic.id, { optimistic: false });
  };

  const editMessage = async (message: Message, content: string) => {
    const moderation = moderateMessage(content);
    if (moderation.action === "delete") return;

    const editedAt = new Date().toISOString();
    updateMessage(activeChannel.id, message.id, {
      content,
      editedAt,
    });

    if (!isSupabaseConfigured || !supabase) return;

    const { error } = await supabase
      .from("messages")
      .update({
        content,
        edited_at: editedAt,
      })
      .eq("id", message.id)
      .eq("user_id", currentUser.id);

    if (error) {
      updateMessage(activeChannel.id, message.id, {
        content: message.content,
        editedAt: message.editedAt,
      });
    }
  };

  const deleteMessage = async (message: Message) => {
    removeMessage(activeChannel.id, message.id);

    if (!isSupabaseConfigured || !supabase) return;

    const { error } = await supabase
      .from("messages")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", message.id)
      .eq("user_id", currentUser.id);

    if (error) {
      upsertMessage(activeChannel.id, message);
    }
  };

  return (
    <section className="flex h-full min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0e] text-[#f6f1e8] shadow-2xl shadow-black/25 sm:min-h-[420px] sm:rounded-3xl md:min-h-[520px]">
      <div className="flex min-h-0 flex-1 flex-col">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0b0b0e]/95 px-4 py-3 backdrop-blur sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#b11226]/15 text-[#f6f1e8]">
            <Hash className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{activeChannel.name}</p>
            <p className="text-xs text-[#d6d0c6]/55">
              {isRealtime ? "Realtime connected" : "Local mode until Supabase is configured"}
            </p>
          </div>
        </div>
        <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-[#d6d0c6]/65">
          <Radio className="size-3.5" />
          {presence.onlineUsers.length} online
          {presence.isTyping && <span>• typing...</span>}
        </div>
      </header>
      <div className="flex-1 overflow-hidden bg-[radial-gradient(circle_at_20%_0%,rgba(177,18,38,0.08),transparent_30%)] p-3 sm:p-4">
        <MessageList
          messages={messages}
          currentUserId={currentUser.id}
          onEdit={editMessage}
          onDelete={deleteMessage}
        />
      </div>
      <div className="border-t border-white/10 bg-[#08080a]/90 p-3 sm:p-4">
        <MessageInput
          channelName={activeChannel.name}
          onSend={sendMessage}
          onTyping={presence.sendTyping}
        />
      </div>
      </div>
    </section>
  );
}
