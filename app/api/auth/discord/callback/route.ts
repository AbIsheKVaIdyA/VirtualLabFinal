import { NextRequest, NextResponse } from "next/server";

type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

type DiscordUserResponse = {
  id: string;
  username: string;
  global_name: string | null;
};

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/dashboard?discord=error&reason=${encodeURIComponent(oauthError)}`, appUrl)
    );
  }

  if (!code || !clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      new URL("/dashboard?discord=error&reason=missing_required_values", appUrl)
    );
  }

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL("/dashboard?discord=error&reason=token_exchange_failed", appUrl)
      );
    }

    const tokenData = (await tokenRes.json()) as DiscordTokenResponse;

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      cache: "no-store",
    });

    if (!userRes.ok) {
      return NextResponse.redirect(
        new URL("/dashboard?discord=error&reason=user_fetch_failed", appUrl)
      );
    }

    const userData = (await userRes.json()) as DiscordUserResponse;
    const displayName = userData.global_name ?? userData.username;
    const guildId = process.env.DISCORD_GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const generalRoleId = process.env.DISCORD_GENERAL_ROLE_ID;
    const welcomeChannelId =
      process.env.DISCORD_WELCOME_CHANNEL_ID ??
      process.env.DISCORD_GENERAL_CHANNEL_ID;

    // Auto-join connected user to server using guilds.join scope.
    if (guildId && botToken) {
      await fetch(`https://discord.com/api/guilds/${guildId}/members/${userData.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token: tokenData.access_token }),
        cache: "no-store",
      });

      // Assign default general role until the user chooses a learning path.
      if (generalRoleId) {
        await fetch(
          `https://discord.com/api/guilds/${guildId}/members/${userData.id}/roles/${generalRoleId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bot ${botToken}`,
            },
            cache: "no-store",
          }
        );
      }

      // Optional welcome message in configured channel.
      if (welcomeChannelId) {
        await fetch(`https://discord.com/api/channels/${welcomeChannelId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bot ${botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: `Welcome <@${userData.id}> to Virtual Lab! You have been added to the general community. Choose your learning path in the app to unlock focused channels.`,
          }),
          cache: "no-store",
        });
      }
    }

    const sessionPayload = encodeURIComponent(
      JSON.stringify({
        id: userData.id,
        username: userData.username,
        displayName,
      })
    );

    const redirect = NextResponse.redirect(
      new URL(
        `/dashboard?discord=connected&username=${encodeURIComponent(displayName)}`,
        appUrl
      )
    );

    redirect.cookies.set("vl_discord_user", sessionPayload, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    const oauthPayload = encodeURIComponent(
      JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        expires_at:
          typeof tokenData.expires_in === "number"
            ? Date.now() + tokenData.expires_in * 1000
            : null,
        scope: tokenData.scope ?? null,
      })
    );

    redirect.cookies.set("vl_discord_oauth", oauthPayload, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return redirect;
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard?discord=error&reason=unexpected_error", appUrl)
    );
  }
}
