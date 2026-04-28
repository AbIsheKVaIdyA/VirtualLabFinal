import type { ModerationAction } from "@/lib/communication-types";
import { Badge } from "@/components/ui/badge";

export function ModerationBadge({
  action,
  reason,
}: {
  action: ModerationAction;
  reason: string;
}) {
  if (action === "allow") return null;

  return (
    <Badge variant={action === "delete" ? "destructive" : "secondary"} title={reason}>
      AI {action}
    </Badge>
  );
}
