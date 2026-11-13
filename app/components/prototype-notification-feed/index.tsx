// PROTOTYPE: throwaway (wayfinder ticket #17). Wires the feed + chosen variant
// into the app layout's slots.
import { useState } from "react";
import { useSearchParams } from "react-router";
import type { KnockFeedConfig } from "~/lib/prototype-knock.server";
import { PrototypeSwitcher } from "~/components/prototype-switcher";
import { useNotificationFeed } from "./use-feed";
import { VARIANTS, type VariantCtx } from "./variants";
import type { NotificationData } from "./samples";

export function usePrototypeNotificationFeed(config: KnockFeedConfig | null, samples: NotificationData[]) {
  const [params] = useSearchParams();
  const key = params.get("variant") && VARIANTS[params.get("variant")!] ? params.get("variant")! : "A";
  const variant = VARIANTS[key];
  const feed = useNotificationFeed(config, samples);
  // Open state is per variant, so switching variants closes the feed.
  const [openKey, setOpenKey] = useState<string | null>(null);
  const ctx: VariantCtx = { feed, open: openKey === key, setOpen: (o) => setOpenKey(o ? key : null) };

  const { SidebarHeader, SidebarNav, MainTop, MainOverride, Overlay } = variant;
  return {
    sidebarHeader: SidebarHeader && <SidebarHeader {...ctx} />,
    sidebarNav: SidebarNav && <SidebarNav {...ctx} />,
    mainTop: MainTop && <MainTop {...ctx} />,
    mainOverride: MainOverride && ctx.open ? <MainOverride {...ctx} /> : null,
    overlay: (
      <>
        {Overlay && <Overlay {...ctx} />}
        <PrototypeSwitcher
          variants={Object.entries(VARIANTS).map(([k, v]) => ({ key: k, name: v.name }))}
          current={key}
          status={`source: ${feed.source} · ${feed.items.length} items · unread ${feed.unreadCount} · unseen ${feed.unseenCount}`}
        />
      </>
    ),
  };
}
