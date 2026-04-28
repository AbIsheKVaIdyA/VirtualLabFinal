import type {
  Channel,
  ChatSeed,
  CommunicationUser,
  Message,
  Server,
  Tenant,
} from "@/lib/communication-types";

const tenant: Tenant = {
  id: "tenant-local",
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
    id: "server-campus",
    tenantId: tenant.id,
    name: "Campus",
    icon: "VL",
  },
];

const channels: Channel[] = [
  {
    id: "channel-general",
    tenantId: tenant.id,
    serverId: servers[0].id,
    type: "text",
    name: "general",
  },
  {
    id: "channel-java",
    tenantId: tenant.id,
    serverId: servers[0].id,
    type: "text",
    name: "java-course",
  },
  {
    id: "channel-python",
    tenantId: tenant.id,
    serverId: servers[0].id,
    type: "text",
    name: "python-course",
  },
  {
    id: "channel-study-room",
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
    id: `optimistic-${crypto.randomUUID()}`,
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
