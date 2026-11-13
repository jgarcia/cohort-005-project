// PROTOTYPE: throwaway. Floating bottom bar that cycles `?variant=` keys.
// Never rendered in production builds.
import { useEffect, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PrototypeSwitcher({
  variants,
  current,
  status,
}: {
  variants: { key: string; name: string }[];
  current: string;
  status?: ReactNode;
}) {
  const [params, setParams] = useSearchParams();
  const index = Math.max(0, variants.findIndex((v) => v.key === current));

  function go(delta: number) {
    const next = variants[(index + delta + variants.length) % variants.length];
    const p = new URLSearchParams(params);
    p.set("variant", next.key);
    setParams(p, { replace: true, preventScrollReset: true });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, [contenteditable]") || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-900 px-2 py-1.5 font-mono text-xs text-white shadow-2xl ring-2 ring-fuchsia-500">
      <button onClick={() => go(-1)} className="rounded-full p-1 hover:bg-white/15" title="Previous (←)">
        <ChevronLeft className="size-4" />
      </button>
      <span className="whitespace-nowrap">
        {variants[index].key} ({variants[index].name})
      </span>
      <button onClick={() => go(1)} className="rounded-full p-1 hover:bg-white/15" title="Next (→)">
        <ChevronRight className="size-4" />
      </button>
      {status && <span className="whitespace-nowrap border-l border-white/20 pl-2 pr-2 text-white/70">{status}</span>}
    </div>
  );
}
