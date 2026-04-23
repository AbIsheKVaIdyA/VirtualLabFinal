import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type DiscordSessionUser = {
  id: string;
  username: string;
  displayName: string;
};

type DiscordChannel = {
  id: string;
  name: string;
  type: number;
};

type DiscordScheduledEvent = {
  id: string;
  name: string;
  scheduled_start_time: string;
  status: number;
};

type DiscordMember = {
  roles: string[];
};

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("vl_discord_user")?.value;
  const primaryPath = cookieStore.get("vl_primary_path")?.value ?? null;
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!sessionCookie || !guildId || !botToken) {
    return NextResponse.json(
      { connected: false, message: "Discord is not connected yet." },
      { status: 200 }
    );
  }

  let user: DiscordSessionUser | null = null;
  try {
    user = JSON.parse(decodeURIComponent(sessionCookie)) as DiscordSessionUser;
  } catch {
    return NextResponse.json(
      { connected: false, message: "Invalid Discord session data." },
      { status: 200 }
    );
  }

  try {
    const mentorRoleId = process.env.DISCORD_MENTOR_ROLE_ID;
    const pathRoleMap = {
      python: process.env.DISCORD_ROLE_PYTHON_ID,
      web: process.env.DISCORD_ROLE_WEBDEV_ID,
      data: process.env.DISCORD_ROLE_DATASCIENCE_ID,
      cyber: process.env.DISCORD_ROLE_CYBERSECURITY_ID,
    };
    const pathChannelMap = {
      python: process.env.DISCORD_CHANNEL_PYTHON_ID,
      web: process.env.DISCORD_CHANNEL_WEBDEV_ID,
      data: process.env.DISCORD_CHANNEL_DATASCIENCE_ID,
      cyber: process.env.DISCORD_CHANNEL_CYBERSECURITY_ID,
    };
    const generalRoleId = process.env.DISCORD_GENERAL_ROLE_ID;
    const generalChannelId = process.env.DISCORD_GENERAL_CHANNEL_ID;

    const [guildRes, memberRes, channelsRes, eventsRes, membersRes] = await Promise.all([
      fetch(`https://discord.com/api/guilds/${guildId}?with_counts=true`, {
        headers: { Authorization: `Bot ${botToken}` },
        cache: "no-store",
      }),
      fetch(`https://discord.com/api/guilds/${guildId}/members/${user.id}`, {
        headers: { Authorization: `Bot ${botToken}` },
        cache: "no-store",
      }),
      fetch(`https://discord.com/api/guilds/${guildId}/channels`, {
        headers: { Authorization: `Bot ${botToken}` },
        cache: "no-store",
      }),
      fetch(`https://discord.com/api/guilds/${guildId}/scheduled-events`, {
        headers: { Authorization: `Bot ${botToken}` },
        cache: "no-store",
      }),
      mentorRoleId
        ? fetch(`https://discord.com/api/guilds/${guildId}/members?limit=1000`, {
            headers: { Authorization: `Bot ${botToken}` },
            cache: "no-store",
          })
        : Promise.resolve(null),
    ]);

    if (!guildRes.ok) {
      return NextResponse.json(
        {
          connected: true,
          user,
          message:
            "Connected to Discord, but could not fetch server summary. Check bot permissions.",
        },
        { status: 200 }
      );
    }

    const guild = (await guildRes.json()) as {
      name: string;
      approximate_member_count?: number;
      approximate_presence_count?: number;
    };

    const memberFound = memberRes.ok;
    const memberData = memberRes.ok
      ? ((await memberRes.json()) as DiscordMember)
      : null;
    const activeRoles = memberData?.roles ?? [];
    const channelsData = channelsRes.ok
      ? ((await channelsRes.json()) as DiscordChannel[])
      : [];
    const eventsData = eventsRes.ok
      ? ((await eventsRes.json()) as DiscordScheduledEvent[])
      : [];
    const textChannels = channelsData
      .filter((channel) => channel.type === 0 || channel.type === 5)
      .slice(0, 8)
      .map((channel) => ({
        id: channel.id,
        name: `#${channel.name}`,
        url: `https://discord.com/channels/${guildId}/${channel.id}`,
      }));

    const upcomingEvents = eventsData
      .filter((event) => event.status === 1)
      .map((event) => ({
        id: event.id,
        title: event.name,
        startsAt: event.scheduled_start_time,
      }))
      .slice(0, 8);

    let mentorCount: number | null = null;
    if (mentorRoleId && membersRes && membersRes.ok) {
      const members = (await membersRes.json()) as DiscordMember[];
      mentorCount = members.filter((member) => member.roles.includes(mentorRoleId)).length;
    }

    const selectedPaths = Object.entries(pathRoleMap)
      .filter(([, roleId]) => Boolean(roleId) && activeRoles.includes(roleId as string))
      .map(([path]) => path);

    const relevantChannelIds = new Set<string>();
    if (generalChannelId) relevantChannelIds.add(generalChannelId);
    selectedPaths.forEach((path) => {
      const mapped = pathChannelMap[path as keyof typeof pathChannelMap];
      if (mapped) relevantChannelIds.add(mapped);
    });
    const relevantChannels = textChannels.filter((channel) =>
      relevantChannelIds.has(channel.id)
    );

    return NextResponse.json(
      {
        connected: true,
        user,
        guild: {
          id: guildId,
          name: guild.name,
          memberCount: guild.approximate_member_count ?? null,
          onlineCount: guild.approximate_presence_count ?? null,
        },
        memberFound,
        inGeneralRole: generalRoleId ? activeRoles.includes(generalRoleId) : null,
        selectedPaths,
        primaryPath,
        relevantChannels,
        channels: textChannels,
        events: upcomingEvents,
        mentorCount,
        eventsCount: upcomingEvents.length,
        welcomeMessage: memberFound
          ? `Welcome ${user.displayName}! You are now in ${guild.name}.`
          : `Welcome ${user.displayName}! Please ensure bot has permission to add members to the server.`,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        connected: true,
        user,
        message: "Connected, but failed to load live community data.",
      },
      { status: 200 }
    );
  }
}
