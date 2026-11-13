// PROTOTYPE: throwaway (wayfinder ticket #17).
// Three variants of the Notification Feed, switchable via `?variant=` on any
// page inside the app layout:
//   A: bell in the sidebar header, popover, badge counts UNSEEN
//   B: "Notifications" sidebar nav item, right-hand drawer, badge counts UNREAD
//   C: top bar over the page, full-page two-pane inbox, explicit "Open" action
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Bell, Check, CheckCheck, Inbox, X, ArrowRight, Circle } from "lucide-react";
import { cn } from "~/lib/utils";
import { KIND_META } from "./kind";
import { timeAgo, type FeedItem, type NotificationFeed } from "./use-feed";

export interface VariantCtx {
  feed: NotificationFeed;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export interface Variant {
  name: string;
  SidebarHeader?: (ctx: VariantCtx) => ReactNode;
  SidebarNav?: (ctx: VariantCtx) => ReactNode;
  MainTop?: (ctx: VariantCtx) => ReactNode;
  MainOverride?: (ctx: VariantCtx) => ReactNode;
  Overlay?: (ctx: VariantCtx) => ReactNode;
}

function KindIcon({ item, size = "size-8" }: { item: FeedItem; size?: string }) {
  const meta = KIND_META[item.data.kind] ?? KIND_META.question_asked;
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full", size, meta.tint)}>
      <meta.Icon className="size-4" />
    </span>
  );
}

function Initials({ name }: { name: string }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
      {initials}
    </span>
  );
}

function Count({ n, className }: { n: number; className?: string }) {
  if (n === 0) return null;
  return (
    <span className={cn("min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold leading-5", className)}>
      {n > 9 ? "9+" : n}
    </span>
  );
}

function Empty({ text = "You’re all caught up." }: { text?: string }) {
  return <div className="p-8 text-center text-sm text-muted-foreground">{text}</div>;
}

// ─── Variant A: bell + popover ─────────────────────────────────────────────

const VariantA: Variant = {
  name: "Bell + popover",
  SidebarHeader: ({ feed, open, setOpen }) => (
    <button
      onClick={() => {
        if (!open) feed.markAllSeen();
        setOpen(!open);
      }}
      title="Notifications"
      className={cn(
        "relative ml-auto rounded-md p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent",
        open && "bg-sidebar-accent"
      )}
    >
      <Bell className="size-4" />
      <Count n={feed.unseenCount} className="absolute -right-1.5 -top-1 bg-red-500 text-white" />
    </button>
  ),
  Overlay: ({ feed, open, setOpen }) => {
    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (!open) return;
      const onDown = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      };
      setTimeout(() => document.addEventListener("mousedown", onDown));
      return () => document.removeEventListener("mousedown", onDown);
    }, [open, setOpen]);
    if (!open) return null;
    return (
      <div
        ref={ref}
        className="fixed left-[14.5rem] top-2 z-40 flex max-h-[70vh] w-96 flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl"
      >
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <span className="text-sm font-semibold">Notifications</span>
          <button
            onClick={() => feed.markAllRead()}
            disabled={feed.unreadCount === 0}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            Mark all as read
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {feed.items.length === 0 && <Empty />}
          {feed.items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                feed.markRead([item.id]);
                setOpen(false);
                navigate(item.data.action_url);
              }}
              className={cn(
                "flex w-full gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted/60",
                !item.readAt && "bg-primary/5"
              )}
            >
              <KindIcon item={item} />
              <div className="min-w-0 flex-1">
                <div className={cn("text-sm", !item.readAt ? "font-semibold" : "text-muted-foreground")}>
                  {item.data.title}
                </div>
                <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.data.snippet}</div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="text-[11px] text-muted-foreground">{timeAgo(item.insertedAt)}</span>
                {!item.readAt && <span className="size-2 rounded-full bg-primary" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  },
};

// ─── Variant B: nav item + right drawer ─────────────────────────────────────

function groupByDay(items: FeedItem[]) {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return [
    { label: "Today", items: items.filter((i) => new Date(i.insertedAt).getTime() >= dayAgo) },
    { label: "Earlier", items: items.filter((i) => new Date(i.insertedAt).getTime() < dayAgo) },
  ].filter((g) => g.items.length > 0);
}

function DrawerBody({ feed, setOpen }: VariantCtx) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"unread" | "all">("unread");
  const shown = tab === "unread" ? feed.items.filter((i) => !i.readAt) : feed.items;
  return (
    <>
      <div className="flex items-center gap-1 border-b px-5 py-2">
        {(["unread", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-3 py-1 text-sm capitalize",
              tab === t ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t} {t === "unread" && feed.unreadCount > 0 && `(${feed.unreadCount})`}
          </button>
        ))}
        <button
          onClick={() => feed.markAllRead()}
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <CheckCheck className="size-3.5" /> Mark all read
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {shown.length === 0 && <Empty />}
        {groupByDay(shown).map((group) => (
          <section key={group.label} className="mb-3">
            <h3 className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </h3>
            {group.items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  feed.markRead([item.id]);
                  setOpen(false);
                  navigate(item.data.action_url);
                }}
                className="group flex cursor-pointer gap-3 rounded-lg p-3 hover:bg-muted/60"
              >
                <div className="relative">
                  <Initials name={item.data.actor_name} />
                  <span className="absolute -bottom-1 -right-1">
                    <KindIcon item={item} size="size-5" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-sm", !item.readAt && "font-semibold")}>{item.data.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.data.snippet}</p>
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    {KIND_META[item.data.kind]?.label} · {item.data.course_title} · {timeAgo(item.insertedAt)}
                  </div>
                </div>
                <button
                  title={item.readAt ? "Mark as unread" : "Mark as read"}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.readAt ? feed.markUnread([item.id]) : feed.markRead([item.id]);
                  }}
                  className="self-start rounded p-1 text-muted-foreground opacity-0 hover:bg-muted group-hover:opacity-100"
                >
                  {item.readAt ? <Circle className="size-3.5" /> : <Check className="size-3.5" />}
                </button>
              </div>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}

const VariantB: Variant = {
  name: "Nav item + drawer",
  SidebarNav: ({ feed, open, setOpen }) => (
    <button
      onClick={() => setOpen(!open)}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        open
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Bell className="size-4" />
      Notifications
      <Count n={feed.unreadCount} className="ml-auto bg-primary text-primary-foreground" />
    </button>
  ),
  Overlay: (ctx) => {
    if (!ctx.open) return null;
    return (
      <div className="fixed inset-0 z-40 flex justify-end bg-black/20" onClick={() => ctx.setOpen(false)}>
        <aside
          onClick={(e) => e.stopPropagation()}
          className="flex h-full w-[28rem] flex-col border-l bg-background shadow-2xl"
        >
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <button onClick={() => ctx.setOpen(false)} className="rounded p-1 hover:bg-muted">
              <X className="size-4" />
            </button>
          </div>
          <DrawerBody {...ctx} />
        </aside>
      </div>
    );
  },
};

// ─── Variant C: top bar + full-page inbox ───────────────────────────────────

function InboxPage({ feed, setOpen }: VariantCtx) {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [group, setGroup] = useState<string>("All");
  const groups = ["All", ...new Set(feed.items.map((i) => KIND_META[i.data.kind]?.group))];
  const shown = group === "All" ? feed.items : feed.items.filter((i) => KIND_META[i.data.kind]?.group === group);
  const selected = feed.items.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      <div className="flex w-[26rem] shrink-0 flex-col border-r">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Inbox className="size-4" />
          <h1 className="font-semibold">Inbox</h1>
          <span className="text-sm text-muted-foreground">{feed.unreadCount} unread</span>
          <button onClick={() => setOpen(false)} className="ml-auto rounded p-1 hover:bg-muted" title="Close inbox">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex gap-1 border-b px-3 py-2">
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={cn(
                "rounded-full border px-3 py-0.5 text-xs",
                group === g ? "border-foreground bg-foreground text-background" : "text-muted-foreground"
              )}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {shown.length === 0 && <Empty />}
          {shown.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedId(item.id);
                feed.markRead([item.id]);
              }}
              className={cn(
                "flex w-full items-start gap-2 border-b px-4 py-3 text-left",
                selectedId === item.id ? "bg-muted" : "hover:bg-muted/50"
              )}
            >
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.readAt ? "bg-transparent" : "bg-primary")} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={cn("truncate text-sm", !item.readAt && "font-semibold")}>{item.data.actor_name}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(item.insertedAt)}</span>
                </div>
                <div className="truncate text-sm">{item.data.title}</div>
                <div className="truncate text-xs text-muted-foreground">{item.data.snippet}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <Empty text="Select a Notification to see it here." />
        ) : (
          <article className="mx-auto max-w-2xl p-10">
            <div className="flex items-center gap-3">
              <KindIcon item={selected} size="size-10" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {KIND_META[selected.data.kind]?.label} · {selected.data.course_title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(selected.insertedAt).toLocaleString()}
                </div>
              </div>
            </div>
            <h2 className="mt-6 text-2xl font-semibold">{selected.data.title}</h2>
            <p className="mt-4 text-base leading-relaxed">{selected.data.snippet}</p>
            <div className="mt-8 flex gap-2">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate(selected.data.action_url);
                }}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Open in Cadence <ArrowRight className="size-4" />
              </button>
              <button
                onClick={() => feed.markUnread([selected.id])}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Mark as unread
              </button>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

const VariantC: Variant = {
  name: "Top bar + inbox page",
  MainTop: ({ feed, open, setOpen }) => (
    <div className="sticky top-0 z-30 flex h-12 items-center justify-end gap-2 border-b bg-background/90 px-6 backdrop-blur">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1 text-sm",
          open ? "border-foreground" : "hover:bg-muted"
        )}
      >
        <Inbox className="size-4" />
        Inbox
        {feed.unreadCount > 0 && (
          <span className="rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
            {feed.unreadCount} new
          </span>
        )}
      </button>
    </div>
  ),
  MainOverride: (ctx) => (ctx.open ? <InboxPage {...ctx} /> : null),
};

export const VARIANTS: Record<string, Variant> = { A: VariantA, B: VariantB, C: VariantC };
