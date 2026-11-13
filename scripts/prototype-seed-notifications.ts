// PROTOTYPE: throwaway (wayfinder ticket #17). Fills real Knock Notification
// Feeds with the sample Notifications, so the Feed variants render live data.
//
//   npx tsx scripts/prototype-seed-notifications.ts [userId ...]
//
// Needs a committed Knock workflow keyed `prototype-notification` with an
// in-app feed step. Defaults to one user per role + a Team Admin.
import Database from "better-sqlite3";
import { samplesFor } from "../app/components/prototype-notification-feed/samples";

process.loadEnvFile(".env");
const WORKFLOW = "prototype-notification";
const sqlite = new Database("data.db", { readonly: true });

const ids = process.argv.slice(2).map(Number);
const userIds = ids.length ? ids : [1, 2, 5, 10];

for (const id of userIds) {
  const user = sqlite.prepare("select id, name, role from users where id = ?").get(id) as
    | { id: number; name: string; role: string }
    | undefined;
  if (!user) {
    console.warn(`no user ${id}`);
    continue;
  }
  const teamAdmin = !!sqlite
    .prepare("select 1 from team_members where user_id = ? and role = 'admin'")
    .get(id);
  // Oldest first so the newest sample ends up on top of the feed.
  for (const data of samplesFor(user.role, teamAdmin).reverse()) {
    const res = await fetch(`https://api.knock.app/v1/workflows/${WORKFLOW}/trigger`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.KNOCK_SECRET_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipients: [{ id: String(user.id), name: user.name }], data }),
    });
    console.log(`${res.status} ${user.name} (${user.role}${teamAdmin ? ", Team Admin" : ""}): ${data.title}`);
    if (!res.ok) {
      console.error(await res.text());
      process.exit(1);
    }
  }
}
