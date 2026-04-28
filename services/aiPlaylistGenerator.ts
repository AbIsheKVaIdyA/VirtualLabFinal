import type { StudyBehaviorSnapshot } from "@/services/studyBehaviorTracker";

export type AudioRecommendationType = "focus" | "podcast" | "mixed";

export type AudioRecommendationItem = {
  title: string;
  spotifyId: string;
  category: "playlist" | "podcast" | "focus-set";
};

export type AudioRecommendation = {
  type: AudioRecommendationType;
  reason: string;
  items: AudioRecommendationItem[];
};

const focusPlaylists: AudioRecommendationItem[] = [
  { title: "Deep Coding Focus", spotifyId: "spotify:playlist:deep-coding-focus", category: "playlist" },
  { title: "Instrumental Study Flow", spotifyId: "spotify:playlist:instrumental-study-flow", category: "focus-set" },
];

const readingAudio: AudioRecommendationItem[] = [
  { title: "Calm Reading Ambient", spotifyId: "spotify:playlist:calm-reading-ambient", category: "focus-set" },
  { title: "Learning Notes Podcast", spotifyId: "spotify:show:learning-notes", category: "podcast" },
];

const energyBoost: AudioRecommendationItem[] = [
  { title: "Momentum Reset", spotifyId: "spotify:playlist:momentum-reset", category: "playlist" },
  { title: "Short Learning Podcast", spotifyId: "spotify:show:short-learning", category: "podcast" },
];

const eveningChill: AudioRecommendationItem[] = [
  { title: "Evening Review Ambient", spotifyId: "spotify:playlist:evening-review", category: "focus-set" },
  { title: "Quiet Concepts", spotifyId: "spotify:show:quiet-concepts", category: "podcast" },
];

export function generateAudioRecommendation(
  behavior: StudyBehaviorSnapshot
): AudioRecommendation {
  if (behavior.sessionDurationMinutes > 60) {
    return {
      type: "mixed",
      reason: "Long study session detected; alternating focus audio with lighter podcast breaks.",
      items: [...focusPlaylists.slice(0, 1), ...readingAudio.slice(1, 2)],
    };
  }

  if (behavior.engagementScore < 35) {
    return {
      type: "mixed",
      reason: "Engagement is low, so the system suggests an energy boost before returning to study.",
      items: energyBoost,
    };
  }

  if (behavior.activity === "coding" || behavior.pageContext === "code-lab") {
    return {
      type: "focus",
      reason: `Recommended because you are working in a ${behavior.topicContext} coding session.`,
      items: focusPlaylists,
    };
  }

  if (behavior.activity === "reading" || behavior.pageContext === "article") {
    return {
      type: "podcast",
      reason: "Reading mode detected; calm ambient audio with a soft learning podcast is preferred.",
      items: readingAudio,
    };
  }

  if (behavior.timeOfDay === "evening" || behavior.timeOfDay === "night") {
    return {
      type: "focus",
      reason: "Evening study detected, switching to lower-intensity review audio.",
      items: eveningChill,
    };
  }

  return {
    type: "focus",
    reason: "Balanced study state detected; keeping a low-distraction focus set active.",
    items: focusPlaylists,
  };
}
