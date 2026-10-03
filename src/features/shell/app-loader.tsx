import { BrandMark } from "@/features/shell/brand-mark";
import { strings } from "@/lib/strings";

type AppLoaderProps = {
  /** Full-viewport takeover (boot / route loading). */
  fullscreen?: boolean;
  label?: string;
};

export function AppLoader({
  fullscreen = false,
  label = strings.app.loading,
}: AppLoaderProps) {
  const body = (
    <div
      className="app-loader flex flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="app-loader__mark relative flex size-[4.5rem] items-center justify-center">
        <span className="app-loader__ring" aria-hidden />
        <BrandMark className="relative z-[1] size-10 text-accent" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <p className="font-mono text-sm font-[650] tracking-[0.08em] text-accent">
          {strings.app.name}
        </p>
        <p className="text-[length:var(--text-caption)] text-muted">{label}</p>
      </div>
    </div>
  );

  if (!fullscreen) return body;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      {body}
    </div>
  );
}
