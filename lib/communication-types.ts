export type TenantRole = "admin" | "mod" | "user";
export type ChannelType = "text" | "voice";
export type ModerationAction = "warn" | "delete" | "allow";

export type Tenant = {
  id: string;
  name: string;
  plan: "free" | "pro";
  createdAt: string;
};

export type CommunicationUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  tenantId: string;
  role: TenantRole;
  engagementScore: number;
};

export type Server = {
  id: string;
  tenantId: string;
  name: string;
  icon?: string | null;
};

export type Channel = {
  id: string;
  tenantId: string;
  serverId: string;
  type: ChannelType;
  name: string;
};

export type Message = {
  id: string;
  tenantId: string;
  channelId: string;
  userId: string;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  user?: Pick<CommunicationUser, "id" | "name" | "avatar" | "role">;
  optimistic?: boolean;
};

export type VoiceSession = {
  id: string;
  tenantId: string;
  channelId: string;
  activeUsers: string[];
  startedAt: string;
  endedAt?: string | null;
};

export type ModerationLog = {
  id: string;
  tenantId: string;
  messageId: string;
  action: ModerationAction;
  reason: string;
  timestamp: string;
};

export type EngagementMetrics = {
  tenantId: string;
  userId: string;
  messagesCount: number;
  voiceMinutes: number;
  participationScore: number;
};

export type ChatSeed = {
  tenant: Tenant;
  users: CommunicationUser[];
  servers: Server[];
  channels: Channel[];
  messages: Message[];
};
