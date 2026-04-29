import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

type NoteRow = {
  video_id?: string;
  video_title?: string;
  note_title?: string;
  topic?: string;
  content: string;
  updated_at?: string;
};

type NoteHistoryRow = {
  id: string;
  content: string;
  created_at: string;
};

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const videoId = request.nextUrl.searchParams.get("videoId");

  if (!userId) {
    return NextResponse.json({ note: "", notes: [] }, { status: 200 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ note: "", notes: [], persisted: false }, { status: 200 });
  }

  if (!videoId) {
    const { data, error } = await supabaseAdmin
      .from("learning_video_notes")
      .select("video_id, video_title, note_title, topic, content, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20)
      .returns<NoteRow[]>();

    if (error) {
      return NextResponse.json({ notes: [], persisted: false }, { status: 200 });
    }

    return NextResponse.json({
      notes:
        data?.map((note) => ({
          videoId: note.video_id ?? "",
          videoTitle: note.video_title ?? "YouTube course video",
          noteTitle: note.note_title ?? note.video_title ?? "YouTube course video",
          topic: note.topic ?? "All",
          content: note.content,
          updatedAt: note.updated_at ?? new Date().toISOString(),
        })) ?? [],
      persisted: true,
    });
  }

  const { data, error } = await supabaseAdmin
    .from("learning_video_notes")
    .select("content")
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .maybeSingle<NoteRow>();

  if (error) {
    return NextResponse.json({ note: "", persisted: false }, { status: 200 });
  }

  const { data: history } = await supabaseAdmin
    .from("learning_video_note_versions")
    .select("id, content, created_at")
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .order("created_at", { ascending: false })
    .limit(8)
    .returns<NoteHistoryRow[]>();

  return NextResponse.json({
    note: data?.content ?? "",
    history:
      history?.map((entry) => ({
        id: entry.id,
        content: entry.content,
        createdAt: entry.created_at,
      })) ?? [],
    persisted: true,
  });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ saved: false }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ saved: false, persisted: false }, { status: 200 });
  }

  const body = (await request.json()) as {
    videoId?: string;
    videoTitle?: string;
    noteTitle?: string;
    topic?: string;
    content?: string;
    createSnapshot?: boolean;
  };

  if (!body.videoId) {
    return NextResponse.json({ saved: false }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("learning_video_notes").upsert(
    {
      user_id: userId,
      video_id: body.videoId,
      video_title: body.videoTitle ?? "YouTube course video",
      note_title: body.noteTitle ?? body.videoTitle ?? "YouTube course video",
      topic: body.topic ?? "All",
      content: body.content ?? "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,video_id" }
  );

  if (!error && body.createSnapshot) {
    await supabaseAdmin.from("learning_video_note_versions").insert({
      user_id: userId,
      video_id: body.videoId,
      video_title: body.videoTitle ?? "YouTube course video",
      topic: body.topic ?? "All",
      content: body.content ?? "",
    });
  }

  return NextResponse.json({ saved: !error, persisted: !error });
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ saved: false }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ saved: false, persisted: false }, { status: 200 });
  }

  const body = (await request.json()) as {
    videoId?: string;
    noteTitle?: string;
  };

  if (!body.videoId || !body.noteTitle?.trim()) {
    return NextResponse.json({ saved: false }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("learning_video_notes")
    .update({
      note_title: body.noteTitle.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("video_id", body.videoId);

  return NextResponse.json({ saved: !error, persisted: !error });
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  const videoId = request.nextUrl.searchParams.get("videoId");

  if (!userId || !videoId) {
    return NextResponse.json({ deleted: false }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ deleted: false, persisted: false }, { status: 200 });
  }

  const { error } = await supabaseAdmin
    .from("learning_video_notes")
    .delete()
    .eq("user_id", userId)
    .eq("video_id", videoId);

  await supabaseAdmin
    .from("learning_video_note_versions")
    .delete()
    .eq("user_id", userId)
    .eq("video_id", videoId);

  return NextResponse.json({ deleted: !error, persisted: !error });
}
