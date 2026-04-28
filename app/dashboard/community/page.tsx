import { CommunityWorkspace } from "@/components/community/CommunityWorkspace";

export default function CommunityWorkspacePage() {
  return (
    <div className="min-h-screen bg-background p-4 text-foreground lg:p-6">
      <CommunityWorkspace showBackLink className="mx-auto max-w-[1600px]" />
    </div>
  );
}
