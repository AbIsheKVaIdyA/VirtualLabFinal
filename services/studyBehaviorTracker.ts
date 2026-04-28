export type UserActivity = "coding" | "reading" | "browsing" | "watching" | "idle";

export type PageContext = "course" | "code-lab" | "article" | "video" | "dashboard";

export type StudyBehaviorSnapshot = {
  activity: UserActivity;
  pageContext: PageContext;
  activeLearningMinutes: number;
  idleMinutes: number;
  sessionDurationMinutes: number;
  interactionCount: number;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  topicContext: string;
  engagementScore: number;
  focusScore: number;
  fatigueScore: number;
};

export function getTimeOfDay(date = new Date()): StudyBehaviorSnapshot["timeOfDay"] {
  const hour = date.getHours();
  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}

export function deriveStudyBehavior(input: {
  activity: UserActivity;
  pageContext: PageContext;
  activeLearningMinutes: number;
  idleMinutes: number;
  sessionDurationMinutes: number;
  interactionCount: number;
  topicContext: string;
  now?: Date;
}): StudyBehaviorSnapshot {
  const engagementScore = Math.max(
    0,
    Math.min(100, input.interactionCount * 4 + input.activeLearningMinutes - input.idleMinutes * 3)
  );
  const focusScore = Math.max(
    0,
    Math.min(100, input.activeLearningMinutes * 2 - input.idleMinutes * 5)
  );
  const fatigueScore = Math.max(
    0,
    Math.min(100, input.sessionDurationMinutes + input.idleMinutes * 4 - input.interactionCount)
  );

  return {
    ...input,
    timeOfDay: getTimeOfDay(input.now),
    engagementScore,
    focusScore,
    fatigueScore,
  };
}

export const defaultStudyBehavior = deriveStudyBehavior({
  activity: "coding",
  pageContext: "code-lab",
  activeLearningMinutes: 38,
  idleMinutes: 2,
  sessionDurationMinutes: 42,
  interactionCount: 14,
  topicContext: "python",
});
