export function SiteFooter() {
  return (
    <footer
      role="contentinfo"
      className={[
        "mt-auto w-full border-t border-border/70",
        "bg-card/85 py-8 text-center backdrop-blur-sm supports-[backdrop-filter]:bg-card/70",
        "pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]",
      ].join(" ")}
    >
      <p className="px-4 text-sm font-semibold tracking-tight text-foreground/90 sm:text-base">
        <span aria-hidden>&copy;</span> 2026 Abhishek Vaidya for ECS IT Operations
      </p>
    </footer>
  );
}
