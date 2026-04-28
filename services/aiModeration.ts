import type { ModerationAction } from "@/lib/communication-types";

type ModerationResult = {
  action: ModerationAction;
  reason: string;
};

const unsafeTerms = ["kill yourself", "hate speech", "dox", "credit card"];
const spamPattern = /(.)\1{8,}|https?:\/\/\S+\s+https?:\/\/\S+/i;

export function moderateMessage(content: string): ModerationResult {
  const normalized = content.trim().toLowerCase();

  if (!normalized) {
    return {
      action: "delete",
      reason: "Empty messages are not allowed.",
    };
  }

  if (unsafeTerms.some((term) => normalized.includes(term))) {
    return {
      action: "warn",
      reason: "Potential unsafe or abusive content detected.",
    };
  }

  if (spamPattern.test(content)) {
    return {
      action: "warn",
      reason: "Potential spam pattern detected.",
    };
  }

  return {
    action: "allow",
    reason: "Message passed moderation checks.",
  };
}

export async function logModerationEvent(input: {
  tenantId: string;
  messageId: string;
  action: ModerationAction;
  reason: string;
}) {
  return input;
}
