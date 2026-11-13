// PROTOTYPE: throwaway (wayfinder ticket #17). Headless Notification Feed
// against Knock's client API (public key + signed user token). Falls back to
// fixtures when the user's Knock feed is empty, so the variants can be judged
// before the seed script has run.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { KnockFeedConfig } from "~/lib/prototype-knock.server";
import type { NotificationData } from "./samples";

export interface FeedItem {
  id: string;
  data: NotificationData;
  insertedAt: string;
  seenAt: string | null;
  readAt: string | null;
}

export type FeedSource = "loading" | "knock" | "fixtures";

const KNOCK = "https://api.knock.app/v1";

function fixtureItems(samples: NotificationData[]): FeedItem[] {
  const now = Date.now();
  const ages = [4, 38, 60 * 5, 60 * 26, 60 * 24 * 3, 60 * 24 * 9];
  return samples.map((data, i) => {
    const insertedAt = new Date(now - ages[i % ages.length] * 60_000).toISOString();
    return {
      id: `fixture-${i}`,
      data,
      insertedAt,
      seenAt: i < 2 ? null : insertedAt,
      readAt: i < 2 ? null : i === 2 ? null : insertedAt,
    };
  });
}

export function useNotificationFeed(
  config: KnockFeedConfig | null,
  samples: NotificationData[]
) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [source, setSource] = useState<FeedSource>("loading");

  const headers = useMemo(
    () =>
      config && {
        Authorization: `Bearer ${config.publicKey}`,
        "X-Knock-User-Token": config.userToken,
        "Content-Type": "application/json",
      },
    [config]
  );

  const load = useCallback(async () => {
    if (!config || !headers) {
      setItems(fixtureItems(samples));
      setSource("fixtures");
      return;
    }
    const res = await fetch(
      `${KNOCK}/users/${config.userId}/feeds/${config.channelId}?page_size=50`,
      { headers }
    );
    const body = await res.json();
    const entries: FeedItem[] = (body.entries ?? []).map((e: any) => ({
      id: e.id,
      data: e.data,
      insertedAt: e.inserted_at,
      seenAt: e.seen_at,
      readAt: e.read_at,
    }));
    if (entries.length === 0) {
      setItems((prev) => (prev[0]?.id.startsWith("fixture-") ? prev : fixtureItems(samples)));
      setSource("fixtures");
    } else {
      setItems(entries);
      setSource("knock");
    }
  }, [config, headers, samples]);

  useEffect(() => {
    load();
    // Prototype only: Knock offers a realtime socket; polling is enough here.
    const timer = setInterval(load, 15_000);
    return () => clearInterval(timer);
  }, [load]);

  const mark = useCallback(
    async (status: "seen" | "read" | "unread", ids: string[]) => {
      if (ids.length === 0) return;
      const stamp = new Date().toISOString();
      setItems((prev) =>
        prev.map((item) => {
          if (!ids.includes(item.id)) return item;
          if (status === "seen") return { ...item, seenAt: item.seenAt ?? stamp };
          if (status === "read")
            return { ...item, seenAt: item.seenAt ?? stamp, readAt: item.readAt ?? stamp };
          return { ...item, readAt: null };
        })
      );
      if (source === "knock" && headers) {
        // Knock keeps read and seen independent: reading doesn't mark seen.
        const statuses = status === "read" ? ["seen", "read"] : [status];
        for (const s of statuses) {
          await fetch(`${KNOCK}/messages/batch/${s}`, {
            method: "POST",
            headers,
            body: JSON.stringify({ message_ids: ids }),
          });
        }
      }
    },
    [source, headers]
  );

  const unread = items.filter((i) => !i.readAt);
  const unseen = items.filter((i) => !i.seenAt);

  return {
    items,
    source,
    unreadCount: unread.length,
    unseenCount: unseen.length,
    markSeen: (ids: string[]) => mark("seen", ids),
    markAllSeen: () => mark("seen", unseen.map((i) => i.id)),
    markRead: (ids: string[]) => mark("read", ids),
    markUnread: (ids: string[]) => mark("unread", ids),
    markAllRead: () => mark("read", unread.map((i) => i.id)),
  };
}

export type NotificationFeed = ReturnType<typeof useNotificationFeed>;

export function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}
