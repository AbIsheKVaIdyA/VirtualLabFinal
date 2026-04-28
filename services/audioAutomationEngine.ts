import {
  generateAudioRecommendation,
  type AudioRecommendation,
} from "@/services/aiPlaylistGenerator";
import type { StudyBehaviorSnapshot } from "@/services/studyBehaviorTracker";

export type AudioAutomationAction =
  | "switch_playlist"
  | "suggest_podcast"
  | "pause_audio"
  | "resume_audio"
  | "enter_focus_mode"
  | "exit_focus_mode";

export type AudioAutomationDecision = {
  action: AudioAutomationAction;
  reason: string;
  recommendation: AudioRecommendation;
  shouldEnterFocusMode: boolean;
};

export function runAudioAutomationEngine(
  behavior: StudyBehaviorSnapshot
): AudioAutomationDecision {
  const recommendation = generateAudioRecommendation(behavior);

  if (behavior.idleMinutes > 5) {
    return {
      action: "suggest_podcast",
      reason: "Idle time crossed five minutes; suggesting a podcast or pausing focus audio.",
      recommendation,
      shouldEnterFocusMode: false,
    };
  }

  if (behavior.activity === "coding" && behavior.sessionDurationMinutes > 30) {
    return {
      action: "switch_playlist",
      reason: "Coding session passed thirty minutes; switching to deep focus audio.",
      recommendation,
      shouldEnterFocusMode: true,
    };
  }

  if (behavior.focusScore > 70 && behavior.engagementScore > 60) {
    return {
      action: "enter_focus_mode",
      reason: "Focus and engagement are rising steadily.",
      recommendation,
      shouldEnterFocusMode: true,
    };
  }

  if (behavior.fatigueScore > 75) {
    return {
      action: "suggest_podcast",
      reason: "Fatigue is increasing; switching to lighter audio can preserve momentum.",
      recommendation,
      shouldEnterFocusMode: false,
    };
  }

  return {
    action: "resume_audio",
    reason: "Study behavior is stable; continue the current recommendation.",
    recommendation,
    shouldEnterFocusMode: false,
  };
}
