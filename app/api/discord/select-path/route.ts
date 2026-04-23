import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type DiscordSessionUser = {
  id: string;
};

type DiscordOAuthCookie = {
  access_token: string;
  refresh_token: string | null;
  expires_at: number | null;
  scope: string | null;
};

const PATH_ROLE_ENV_MAP: Record<string, string | undefined> = {
  python: process.env.DISCORD_ROLE_PYTHON_ID,
  web: process.env.DISCORD_ROLE_WEBDEV_ID,
  data: process.env.DISCORD_ROLE_DATASCIENCE_ID,
  cyber: process.env.DISCORD_ROLE_CYBERSECURITY_ID,
};

type DiscordApiError = {
  code?: number;
  message?: string;
};

function formatDiscordError(status: number, payload: DiscordApiError | null) {
  if (status === 403 || payload?.code === 50013) {
    return "Discord denied role assignment (Missing Permissions). Ensure bot has Manage Roles and bot role is above target roles.";
  }
  if (payload?.code === 10007) {
    return "User is not a member of the Discord server yet. Reconnect Discord and try again.";
  }
  if (status === 404) {
    return "Discord could not find that member in the server. Reconnect Discord and try again.";
  }
  if (status === 400 || payload?.code === 50035) {
    return "Discord rejected the role request. Verify path role IDs in .env.local.";
  }
  return payload?.message
    ? `Discord error: ${payload.message}`
    : `Discord role assignment failed with status ${status}.`;
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("vl_discord_user")?.value;
  const oauthCookie = cookieStore.get("vl_discord_oauth")?.value;
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const generalRoleId = process.env.DISCORD_GENERAL_ROLE_ID;

  if (!sessionCookie || !guildId || !botToken) {
    return NextResponse.json(
      { ok: false, message: "Discord is not connected yet." },
      { status: 400 }
    );
  }

  let user: DiscordSessionUser;
  try {
    user = JSON.parse(decodeURIComponent(sessionCookie)) as DiscordSessionUser;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid Discord session." },
      { status: 400 }
    );
  }

  let oauth: DiscordOAuthCookie | null = null;
  if (oauthCookie) {
    try {
      oauth = JSON.parse(decodeURIComponent(oauthCookie)) as DiscordOAuthCookie;
    } catch {
      oauth = null;
    }
  }

  const body = (await request.json()) as { path?: string };
  const path = body.path?.toLowerCase().trim() ?? "";
  const pathRoleId = PATH_ROLE_ENV_MAP[path];

  if (!pathRoleId) {
    return NextResponse.json(
      { ok: false, message: "Unsupported path or missing role configuration." },
      { status: 400 }
    );
  }

  try {
    const memberCheckRes = await fetch(
      `https://discord.com/api/guilds/${guildId}/members/${user.id}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
        cache: "no-store",
      }
    );

    if (!memberCheckRes.ok) {
      if (memberCheckRes.status === 404 && oauth?.access_token) {
        const joinRes = await fetch(
          `https://discord.com/api/guilds/${guildId}/members/${user.id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bot ${botToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ access_token: oauth.access_token }),
            cache: "no-store",
          }
        );

        if (!joinRes.ok) {
          const payload = (await joinRes.json().catch(() => null)) as DiscordApiError | null;
          const scopeHint =
            oauth.scope && !oauth.scope.includes("guilds.join")
              ? " Missing OAuth scope guilds.join. Reconnect Discord."
              : "";
          return NextResponse.json(
            {
              ok: false,
              message: `${formatDiscordError(joinRes.status, payload)}${scopeHint}`,
            },
            { status: 400 }
          );
        }
      } else if (memberCheckRes.status === 404) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Discord session is missing the join token. Reconnect Discord once more, then try selecting your path again.",
          },
          { status: 400 }
        );
      } else {
        const payload = (await memberCheckRes.json().catch(() => null)) as DiscordApiError | null;
        return NextResponse.json(
          { ok: false, message: formatDiscordError(memberCheckRes.status, payload) },
          { status: 400 }
        );
      }
    }

    // Keep general access always (if configured), and add selected path role.
    if (generalRoleId) {
      const generalRoleRes = await fetch(
        `https://discord.com/api/guilds/${guildId}/members/${user.id}/roles/${generalRoleId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bot ${botToken}`,
          },
          cache: "no-store",
        }
      );

      if (!generalRoleRes.ok) {
        const payload = (await generalRoleRes.json().catch(() => null)) as DiscordApiError | null;
        return NextResponse.json(
          { ok: false, message: formatDiscordError(generalRoleRes.status, payload) },
          { status: 500 }
        );
      }
    }

    const addPathRoleRes = await fetch(
      `https://discord.com/api/guilds/${guildId}/members/${user.id}/roles/${pathRoleId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${botToken}`,
        },
        cache: "no-store",
      }
    );

    if (!addPathRoleRes.ok) {
      const payload = (await addPathRoleRes.json().catch(() => null)) as DiscordApiError | null;
      return NextResponse.json(
        { ok: false, message: formatDiscordError(addPathRoleRes.status, payload) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Path '${path}' assigned successfully. General access remains active.`,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Unexpected error while assigning path." },
      { status: 500 }
    );
  }
}
