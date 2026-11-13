// PROTOTYPE: throwaway. Per-kind icon + label shared by every variant.
import { MessageCircleQuestion, MessageSquareReply, Receipt, ReceiptText, UserPlus } from "lucide-react";
import type { NotificationKind } from "./samples";

export const KIND_META: Record<NotificationKind, { label: string; group: string; Icon: typeof Receipt; tint: string }> = {
  refund_raised: { label: "Refund Request", group: "Refunds", Icon: Receipt, tint: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
  refund_decided: { label: "Refund decided", group: "Refunds", Icon: ReceiptText, tint: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" },
  seat_claimed: { label: "Seat claimed", group: "Team", Icon: UserPlus, tint: "text-sky-600 bg-sky-100 dark:bg-sky-900/30" },
  question_asked: { label: "Question", group: "Discussion", Icon: MessageCircleQuestion, tint: "text-violet-600 bg-violet-100 dark:bg-violet-900/30" },
  reply_posted: { label: "Reply", group: "Discussion", Icon: MessageSquareReply, tint: "text-violet-600 bg-violet-100 dark:bg-violet-900/30" },
};
