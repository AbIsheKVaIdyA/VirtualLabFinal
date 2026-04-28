export function calculateParticipationScore(input: {
  messagesCount: number;
  voiceMinutes: number;
  helpfulReactions?: number;
}) {
  return (
    input.messagesCount * 1 +
    input.voiceMinutes * 5 +
    (input.helpfulReactions ?? 0) * 10
  );
}

export function applyMessageEngagement(current: {
  messagesCount: number;
  voiceMinutes: number;
  helpfulReactions?: number;
}) {
  const next = {
    ...current,
    messagesCount: current.messagesCount + 1,
  };

  return {
    ...next,
    participationScore: calculateParticipationScore(next),
  };
}

export function applyVoiceEngagement(
  current: {
    messagesCount: number;
    voiceMinutes: number;
    helpfulReactions?: number;
  },
  minutes: number
) {
  const next = {
    ...current,
    voiceMinutes: current.voiceMinutes + minutes,
  };

  return {
    ...next,
    participationScore: calculateParticipationScore(next),
  };
}
