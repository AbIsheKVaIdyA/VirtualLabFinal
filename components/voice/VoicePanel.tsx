"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Mic, Radio } from "lucide-react";

import type { Channel } from "@/lib/communication-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JoinVoiceButton } from "@/components/voice/JoinVoiceButton";

export function VoicePanel({ channel }: { channel: Channel }) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [inputLevel, setInputLevel] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!streamRef.current) return;

    streamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }, [muted]);

  useEffect(() => {
    if (!joined || !streamRef.current) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(streamRef.current);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frameId = 0;

    analyser.fftSize = 256;
    source.connect(analyser);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const average = data.reduce((total, value) => total + value, 0) / data.length;
      setInputLevel(Math.min(100, Math.round((average / 128) * 100)));
      frameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(frameId);
      void audioContext.close();
    };
  }, [joined]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const joinVoice = async () => {
    setMicError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError("Your browser does not support microphone capture.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
      setJoined(true);
    } catch {
      setMicError("Microphone permission was denied or no microphone was found.");
    }
  };

  const leaveVoice = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setInputLevel(0);
    setJoined(false);
    setMuted(false);
    setDeafened(false);
  };

  return (
    <Card className="h-full rounded-2xl">
      <CardHeader>
        <CardTitle>Voice: {channel.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-background/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Radio className="size-4 text-primary" />
                {joined ? "Connected to voice" : "Ready to join voice"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {joined
                  ? muted
                    ? "Your microphone is muted."
                    : "Your microphone is active. Speak and watch the input meter."
                  : "Click Join Voice and allow microphone permission."}
              </p>
            </div>
            <div className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
              {deafened ? "Output muted" : "Output enabled"}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <Activity className="size-3.5" />
                Mic input
              </span>
              <span>{joined && !muted ? `${inputLevel}%` : "off"}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${joined && !muted ? inputLevel : 0}%` }}
              />
            </div>
          </div>

          {joined && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border bg-card/70 p-3 text-sm">
              <span className="grid size-9 place-items-center rounded-full bg-primary/15 text-primary">
                <Mic className="size-4" />
              </span>
              <div>
                <p className="font-semibold">You are in {channel.name}</p>
                <p className="text-xs text-muted-foreground">
                  Local voice capture is active for this room.
                </p>
              </div>
            </div>
          )}

          {micError && (
            <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {micError}
            </p>
          )}
        </div>
        <JoinVoiceButton
          joined={joined}
          muted={muted}
          deafened={deafened}
          onJoin={joinVoice}
          onLeave={leaveVoice}
          onToggleMute={() => setMuted((value) => !value)}
          onToggleDeafen={() => setDeafened((value) => !value)}
        />
      </CardContent>
    </Card>
  );
}
