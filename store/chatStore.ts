import type {
  Channel,
  ChatSeed,
  CommunicationUser,
  Message,
  Server,
  Tenant,
} from "@/lib/communication-types";

const tenant: Tenant = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Virtual Lab School",
  plan: "free",
  createdAt: new Date().toISOString(),
};

const user: CommunicationUser = {
  id: "user-local",
  tenantId: tenant.id,
  name: "Student",
  email: "student@virtuallab.local",
  role: "user",
  engagementScore: 0,
};

const servers: Server[] = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    tenantId: tenant.id,
    name: "Campus",
    icon: "VL",
  },
];

const channels: Channel[] = [
  {
    id: "33333333-3333-4333-8333-333333333333",
    tenantId: tenant.id,
    serverId: servers[0].id,
    type: "text",
    name: "general",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    tenantId: tenant.id,
    serverId: servers[0].id,
    type: "text",
    name: "java-course",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    tenantId: tenant.id,
    serverId: servers[0].id,
    type: "text",
    name: "python-course",
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    tenantId: tenant.id,
    serverId: servers[0].id,
    type: "voice",
    name: "study-room",
  },
];

export const localChatSeed: ChatSeed = {
  tenant,
  users: [user],
  servers,
  channels,
  messages: [],
};

export function createOptimisticMessage(input: {
  tenantId: string;
  channelId: string;
  userId: string;
  userName: string;
  content: string;
}): Message {
  return {
    id: crypto.randomUUID(),
    tenantId: input.tenantId,
    channelId: input.channelId,
    userId: input.userId,
    content: input.content,
    createdAt: new Date().toISOString(),
    optimistic: true,
    user: {
      id: input.userId,
      name: input.userName,
      role: "user",
    },
  };
}
