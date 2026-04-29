import { CommunityWorkspace } from "@/components/community/CommunityWorkspace";

export default function CommunityWorkspacePage() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] text-foreground sm:px-6 sm:pb-10 sm:pt-10">
      <CommunityWorkspace showBackLink className="mx-auto max-w-[1600px] min-w-0" />
    </div>
  );
}
