import { Activity, Clock, Headphones, Target } from "lucide-react";

import type { StudyBehaviorSnapshot } from "@/services/studyBehaviorTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StudyInsightsPanel({ behavior }: { behavior: StudyBehaviorSnapshot }) {
  const insights = [
    { label: "Active learning", value: `${behavior.activeLearningMinutes} min`, icon: Clock },
    { label: "Focus score", value: behavior.focusScore, icon: Target },
    { label: "Engagement", value: behavior.engagementScore, icon: Activity },
    { label: "Audio context", value: behavior.topicContext, icon: Headphones },
  ];

  return (
    <Card className="border-white/10 bg-[#0b0b0d] text-[#f6f1e8]">
      <CardHeader>
        <CardTitle>Study Insights</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {insights.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="flex items-center gap-2 text-xs text-[#d6d0c6]/60">
              <Icon className="size-3.5 text-blue-300" />
              {label}
            </p>
            <p className="mt-1 text-lg font-semibold capitalize">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
