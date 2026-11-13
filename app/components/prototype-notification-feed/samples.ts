// PROTOTYPE: throwaway. Sample Notifications from the v1 catalogue
// (wayfinder ticket #17). Used as fixtures in the UI and as trigger data by
// scripts/prototype-seed-notifications.ts.

export type NotificationKind =
  | "refund_decided"
  | "refund_raised"
  | "seat_claimed"
  | "question_asked"
  | "reply_posted";

// The trigger `data` we send to Knock. The UI renders from this, not from the
// Knock template, so the workflow template can stay trivial.
export interface NotificationData {
  kind: NotificationKind;
  actor_name: string;
  course_title: string;
  title: string;
  snippet: string;
  action_url: string;
}

const LESSON_URL = "/courses/building-rest-apis-with-nodejs/lessons/20";

export const SAMPLES: Record<NotificationKind, NotificationData[]> = {
  refund_raised: [
    {
      kind: "refund_raised",
      actor_name: "Emma Wilson",
      course_title: "Introduction to TypeScript",
      title: "Emma Wilson asked for a refund",
      snippet: "“The course moved faster than I expected and I’m not ready for generics yet.”",
      action_url: "/admin/refunds",
    },
    {
      kind: "refund_raised",
      actor_name: "Bossy McBossface",
      course_title: "Design Systems with Tailwind",
      title: "Bossy McBossface asked for a refund on a Team Licence",
      snippet: "“We bought 10 seats but the team was reorganised.”",
      action_url: "/admin/refunds",
    },
  ],
  refund_decided: [
    {
      kind: "refund_decided",
      actor_name: "Alex Rivera",
      course_title: "Introduction to TypeScript",
      title: "Your refund for Introduction to TypeScript was approved",
      snippet:
        "Your Enrollment has ended and the full amount is on its way. Note: “Sorry it wasn’t the right fit.”",
      action_url: "/dashboard",
    },
  ],
  seat_claimed: [
    {
      kind: "seat_claimed",
      actor_name: "Ava Nakamura",
      course_title: "Building REST APIs with Node.js",
      title: "Ava Nakamura claimed a seat",
      snippet: "Building REST APIs with Node.js · 4 Unclaimed Seats left",
      action_url: "/team",
    },
    {
      kind: "seat_claimed",
      actor_name: "Noah Blackwood",
      course_title: "Building REST APIs with Node.js",
      title: "Noah Blackwood claimed a seat",
      snippet: "Building REST APIs with Node.js · 3 Unclaimed Seats left",
      action_url: "/team",
    },
  ],
  question_asked: [
    {
      kind: "question_asked",
      actor_name: "James Park",
      course_title: "Building REST APIs with Node.js",
      title: "James Park asked a Question on “What is a REST API?”",
      snippet: "“Is PATCH ever idempotent? The lesson says no but the RFC seems to allow it…”",
      action_url: `${LESSON_URL}#comments`,
    },
    {
      kind: "question_asked",
      actor_name: "Olivia Martinez",
      course_title: "Building REST APIs with Node.js",
      title: "Olivia Martinez asked a Question on “What is a REST API?”",
      snippet: "“Where do status codes like 422 fit in?”",
      action_url: `${LESSON_URL}#comments`,
    },
  ],
  reply_posted: [
    {
      kind: "reply_posted",
      actor_name: "Marcus Johnson",
      course_title: "Building REST APIs with Node.js",
      title: "Marcus Johnson replied to your Question on “What is a REST API?”",
      snippet: "“Good catch: PATCH can be idempotent, it just isn’t required to be. I’ll fix the slide.”",
      action_url: `${LESSON_URL}#comments`,
    },
  ],
};

export function samplesFor(role: string, isTeamAdmin: boolean): NotificationData[] {
  if (role === "admin") return [...SAMPLES.refund_raised, ...SAMPLES.refund_decided];
  if (role === "instructor") return [...SAMPLES.question_asked];
  if (isTeamAdmin) return [...SAMPLES.seat_claimed, ...SAMPLES.refund_decided];
  return [...SAMPLES.reply_posted, ...SAMPLES.refund_decided];
}
