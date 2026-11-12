# Hosted in-app notification vendors for Cadence

## Question

Which hosted notification service should power an in-app "Inbox" in Cadence (React Router v7, Drizzle/SQLite, Tailwind + shadcn/ui, fake dev users switched through the DevUI panel, vitest tests that must never reach the network)? The candidates are Novu, Knock, Courier, MagicBell and SuprSend, compared on free tier, React inbox, Node SDK, dev/test story, message state model, identity/auth, and room for email and preferences later.

This document compares the candidates. It does not choose one.

## Date read and package versions

Read on **2026-11-12**. Versions are the `latest` dist-tag from `https://registry.npmjs.org/<pkg>` as of that date.

| Vendor    | React inbox package                                      | Server SDK                                    | Notes |
| --------- | -------------------------------------------------------- | --------------------------------------------- | ----- |
| Novu      | `@novu/react` **3.19.2** (2026-09-07; peer react ^18 \|\| ^19) | `@novu/api` **3.19.1** (2026-09-02)         | `@novu/node` 2.6.6 is deprecated ("March 20, 2025 marks the end of support"). Don't use it. |
| Knock     | `@knocklabs/react` **0.15.1** (2026-11-06; peer react ^17–19; `next` and `@tanstack/react-router` are optional peers) | `@knocklabs/node` **1.41.1** (2026-11-10) | Headless core is `@knocklabs/react-core` 0.17.1, and the client is `@knocklabs/client` 0.23.1. |
| Courier   | `@trycourier/courier-react` **9.3.5** (2026-11-09; peer react >=18) | `@trycourier/courier` **10.0.0** (2026-10-29) | `@trycourier/react-inbox` 7.4.8 is deprecated ("Moved to @trycourier/courier-react"). The web-component inbox is `@trycourier/courier-ui-inbox` 2.7.4. |
| MagicBell | `@magicbell/react` **1.14.0** (2026-07-29). It declares no React peer dependency. | `magicbell-js` **1.8.0** (2026-07-29; `magicbell-js/project-client`) | Legacy `@magicbell/magicbell-react` 11.5.1 and `@magicbell/react-headless` 5.5.1 still exist, and `@magicbell/core` 5.4.0 is deprecated. The current docs describe `@magicbell/react`. |
| SuprSend  | `@suprsend/react` **1.5.0** (2026-10-22; peer react >=16.8) | `@suprsend/node-sdk` **1.15.1** (2026-05-19) | `@suprsend/react-inbox` 3.9.0 is deprecated ("Package no longer supported"). The headless package is `@suprsend/react-core` 2.4.0. |

## Comparison table

| Criterion | Novu | Knock | Courier | MagicBell | SuprSend |
| --- | --- | --- | --- | --- | --- |
| **Free tier** | 10k workflow runs/mo, unlimited subscribers, 3 team members, 2 environments (Dev+Prod), 5 workflows, 24h activity retention | 10k messages/mo, unlimited seats, unlimited environments, 30-day logs, unlimited feed retention | "Developer": 10k sends/mo, no per-seat fees; Test env sends count toward the quota | "Builder": **1,000 deliveries/mo**, unlimited team members, **1 project** | 10k notifications/mo, unlimited team members; 30-day premium trial then Free; 30-day logs |
| **Next paid tier** | Pro from $30/mo | Starter $250/mo + usage | Pay-as-you-go $0.005/send | Startup $249/mo (50k) | Essentials $100/mo (50k) |
| **Prebuilt React inbox** | `<Inbox/>` plus composable `Bell`, `Notifications`, `Preferences` | `NotificationFeedPopover` / feed components | `<CourierInbox/>`, `<CourierInboxPopupMenu/>`, `<CourierToast/>` | `<Inbox/>`, `<FloatingInbox/>`, `<InlineNotification/>` | `<Inbox/>`, `<NotificationFeed/>` |
| **Restyling** | `appearance` prop: `baseTheme`, `variables`, `elements` (accept **Tailwind class strings** or callbacks), `icons`; `--nv-*` CSS vars | `--rnf-*` CSS variables, `rnf-` classes, `colorMode` light/dark; can drop the CSS entirely | `lightTheme`/`darkTheme` JS theme objects, `mode: "system"`; `renderListItem` for custom rows | Plain CSS: `--magicbell-*` variables and `.magicbell--*` classes; `ItemComponent` override | JS `theme` object of inline `CSSProperties`, `themeType` dark/light; many render-prop slots |
| **Headless hooks** | `useNotifications`, `useCounts`, `useNovu` | `useNotifications`, `useNotificationStore`, `usePreferences` | `useCourier()` → `inbox.readMessage`, `archiveMessage`, etc. | `magicbell-js` user-client + realtime (no hooks confirmed) | `@suprsend/react-core` hooks / `useSuprSendClient` |
| **Node trigger** | `novu.trigger({ workflowId, to, payload })` | `client.workflows.trigger(key, { recipients, data })` | `client.send.message({ message: { to, template \| content, data } })` | `client.broadcasts.createBroadcast({ title, content, recipients })` | `client.workflows.trigger(new WorkflowTriggerRequest({ workflow, recipients, data }))` |
| **Dev/test isolation** | Dev and Prod envs with separate keys; keyless `<Inbox/>` demo mode (24h data) | Separate environments with separate keys (opt-in; dev env added when enabled) | Test and Production envs with separate keys; Mock keys are **Enterprise only** | No separate environments found; 1 project on free | Separate staging/production workspaces with separate keys |
| **SDK seam for tests** | `serverURL` and custom `httpClient` options | custom `fetch` / `fetchOptions` options | not verified | not verified | not verified |
| **Message states** | read/unread, seen (auto after about 1s visible, one-way), archived, snoozed | seen/unseen, read/unread, interacted, archived/unarchived (+ timestamps) | read, opened, archived (ISO timestamps) | read/unread, seen, archived/unarchived (API) | read/unread, seen (auto tracking), archived, interacted, plus pinned and expiry |
| **Recipient creation** | Inline upsert via `to` on trigger; create/bulk APIs too | Inline identify on trigger (object recipients); `PUT /v1/users/{id}` upsert | **Not** created on send; `POST /profiles/{id}` upsert (merge) | `PUT /v2/users` upsert; recipients in broadcast | Inline recipient objects on trigger; user `save()` |
| **Frontend auth in prod** | Optional **HMAC-SHA256** of subscriberId (`subscriberHash`); enforced once enabled | **RS256 JWT** (`userToken`) via "enhanced security mode"; `signUserToken` helper; off by default | **JWT always required** (issue-token endpoint, scoped) | **User JWT always required** (`token` prop) | **ES256 JWT** (`userToken`) via enhanced security mode; off by default |
| **Preferences UI** | Prebuilt (`Preferences` in Inbox) | Headless only (`usePreferences` / client) | Prebuilt `<CourierPreferences/>` | Prebuilt `UserPreferences` | Headless only ("Drop-in preference components are a work in progress") |
| **Email channel** | Yes | Yes | Yes | Yes | Yes |

## Novu

- **Free tier:** 10,000 workflow runs per month, unlimited subscribers, up to 3 team members, 2 environments (Dev and Prod), up to 5 workflows, 24-hour activity feed retention, 60 RPS. Pro starts at $30/mo. Source: https://novu.co/pricing
- **Inbox styling:** The `appearance` prop takes `baseTheme` (a `dark` theme ships in `@novu/react/themes`), `variables` (`colorBackground`, `colorPrimary`, `colorForeground`, `borderRadius`, `fontSize`, and others), `elements` (per-element style objects, **class strings such as Tailwind utilities**, or callbacks that receive context), `icons`, and `animations`. Motion tokens are exposed as `--nv-*` CSS variables on `.novu`. Styles are injected into `<head>` or a shadow root. There is no automatic system dark mode, so you pick the theme. Source: https://docs.novu.co/platform/inbox/react/styling
  - The docs' setup templates suggest mapping the host app's Tailwind config or CSS variables into `appearance`. That fits shadcn's CSS-variable tokens. Source: https://docs.novu.co/platform/inbox/react/get-started
- **Components and hooks:** `Inbox`, `Bell`, `Notifications`, `InboxContent`, and `Preferences` (https://docs.novu.co/platform/inbox/overview). Headless hooks include `useNotifications` (pagination, realtime), `useCounts` (unread/unseen/total), `useNovu`, and `NovuProvider` (https://docs.novu.co/platform/inbox/headless/api-reference). Overriding `renderNotification` means you rebuild the read, archive, and snooze actions yourself (https://docs.novu.co/platform/inbox/advanced-customization/customize-notification-items).
- **Keyless mode:** `<Inbox />` with no props runs in a test-only mode. Its data "expires in 24h". Source: https://docs.novu.co/platform/inbox/react/get-started
- **Node SDK:** `@novu/api`:
  ```ts
  const novu = new Novu({ secretKey });
  await novu.trigger({ workflowId, to: { subscriberId, email, firstName }, payload, overrides });
  ```
  The constructor accepts `serverURL` and a custom `httpClient` (`HTTPClient` from `@novu/api/lib/http`, with `beforeRequest` hooks). Source: https://docs.novu.co/platform/sdks/server/typescript
- **Environments:** Development and Production by default, each with its own Application Identifier and Secret Key. Workflows are authored in Dev and published to Prod, and Prod is view-only. Custom environments require Team or Enterprise. Source: https://docs.novu.co/platform/concepts/environments
- **State model:** The notification has `isRead`, `isSeen`, `isArchived`, `isSnoozed`, and `snoozedUntil`. Seen is set automatically after the item has been visible for about 1s, and there is no unseen method. The default tabs are Inbox, Unread, Archived, and Snoozed. While a notification is snoozed it can't be read or archived. Snooze needs SDK >= 3.3.0 and is cloud-only. Sources: https://docs.novu.co/platform/inbox/migration-guide, https://docs.novu.co/platform/inbox/features/snooze
- **Subscribers:** A trigger creates or updates the subscriber passed in `to` (just-in-time upsert). There are also Create and Bulk create (500 per request) APIs. `subscriberId` must be unique per environment. Source: https://docs.novu.co/platform/concepts/subscribers
- **Frontend auth:** HMAC is opt-in per In-App integration. Once you enable it, the Inbox won't load without `subscriberHash = HMAC-SHA256(secretKey, subscriberId)` (hex), computed on the server. Updating subscriber profile fields from the client also requires HMAC. Sources: https://docs.novu.co/platform/inbox/prepare-for-production, https://docs.novu.co/platform/inbox/react/get-started
- **Preferences and email:** Global and per-workflow channel preferences (email, SMS, push, in-app), an Update preferences API, and a prebuilt `Preferences` component. Source: https://docs.novu.co/platform/concepts/subscribers

## Knock

- **Free tier:** Up to 10,000 messages per month, unlimited team members, unlimited isolated environments, 30-day log retention, unlimited feed retention, and up to 500 guide recipients per month. No MAU cap is listed. Starter is $250/mo plus usage. Source: https://knock.app/pricing
- **Feed component and styling:** Install `@knocklabs/react` and import `@knocklabs/react/dist/index.css`. `KnockProvider` takes `apiKey` (public key) and `user={{ id }}`. `KnockFeedProvider` takes `feedId`, `colorMode` (`light` by default, or `dark`), `defaultFeedOptions`, and `userToken` when enhanced security is on. Styling uses `--rnf-*` CSS variables (full list in `theme.css`) and `rnf-` class names, and you can replace the Knock CSS entirely. Tailwind isn't mentioned. Source: https://docs.knock.app/in-app-ui/react/feed
- **Headless:** `useNotifications`, `useNotificationStore`, and `useKnockClient`. Source: https://docs.knock.app/in-app-ui/react/headless/feed
- **Node SDK:** `@knocklabs/node` (README on npm):
  ```ts
  const client = new Knock({ apiKey: process.env.KNOCK_API_KEY });
  await client.workflows.trigger('workflow-key', { recipients: ['user-id'], data: {...} });
  ```
  The constructor accepts a custom `fetch` and `fetchOptions`. Source: https://www.npmjs.com/package/@knocklabs/node
- **Environments:** Accounts start with only production. Enabling environments adds development, and that can't be undone. Each environment has its own API keys and its own users, messages, and logs. Workflows are committed in dev and promoted to prod. No sandbox or mock mode is documented. Source: https://docs.knock.app/concepts/environments
- **State model:** seen/unseen, read/unread, interacted (can't be removed in the JS SDK), and archived/unarchived, with `seen_at`, `read_at`, `interacted_at`, and `archived_at` timestamps. Batch updates take up to 50 messages. Archived messages are hidden by default. The feed can be filtered by status, and its metadata returns counts. Sources: https://docs.knock.app/in-app-ui/feeds/overview, https://docs.knock.app/api-reference/messages, https://docs.knock.app/in-app-ui/javascript/sdk/message-client
- **Identity:** Upsert with `PUT /v1/users/{user_id}`. Recipients can also be identified inline on trigger as objects (`{ id, ...props }`, not bare strings), and Knock "guarantees that recipients are identified before executing any other action." Source: https://docs.knock.app/managing-recipients/identifying-recipients
- **Frontend auth:** Enhanced security mode is off by default ("a request with your public key can act as any user"). Production should enable it. It uses an RS256 JWT with a `sub` claim, signed with a dashboard signing key, through `signUserToken` from `@knocklabs/node/lib/tokenSigner` (`KNOCK_SIGNING_KEY`, 3600s default expiry). You can leave it off in dev by keeping dev in a separate environment. Source: https://docs.knock.app/in-app-ui/security-and-authentication
- **Preferences:** No prebuilt preference UI. You build one with `knockClient.user.getPreferences/setPreferences` or the `usePreferences` hook. The preference-center layout can be configured in the dashboard, per environment. Sources: https://docs.knock.app/in-app-ui/react/preferences, https://docs.knock.app/preferences/custom-preference-center

## Courier

- **Free tier:** "Developer" plan, up to 10k sends per month, no per-seat fees. Test and custom environments count toward sends the same way Production does. A template delivered through several channels counts as one send. Business is pay-as-you-go at $0.005 per send. Source: https://www.courier.com/pricing
- **React SDK:** `@trycourier/courier-react` provides `<CourierInbox/>`, `<CourierInboxPopupMenu/>`, `<CourierToast/>`, `<CourierPreferences/>`, and `useCourier()`. Sign in with `courier.shared.signIn({ userId, jwt })`. React 17 needs `@trycourier/courier-react-17`. Sources: https://www.npmjs.com/package/@trycourier/courier-react, https://www.courier.com/docs/sdk-libraries/courier-react-web/
- **Styling:** `CourierInboxTheme` JS objects passed as `lightTheme`/`darkTheme`, with `mode` set to `"light"`, `"dark"`, or `"system"` (default). The objects are deep-merged over the defaults, and `defaultLightTheme`, `defaultDarkTheme`, and `mergeTheme` are exported. The theme reference doesn't mention CSS variables or Tailwind. Source: https://www.courier.com/docs/sdk-libraries/courier-ui-inbox-web-theme/
  - Custom rows use `renderListItem`. Fully headless use goes through `useCourier().inbox` (`readMessage`, `archiveMessage`, `readAllMessages`, `totalUnreadCount`, `feeds`), and you must call `inbox.listenForUpdates()` for realtime. Source: https://courier.com/docs/platform/inbox/web/react-sdk
- **Feeds and tabs:** `registerFeeds()` with tabs filtered by `tags`, `archived`, `status` (read/unread), and `from`. Source: https://www.courier.com/docs/sdk-libraries/courier-react-web/
- **Node SDK:** `@trycourier/courier` (Node 20+):
  ```ts
  const client = new Courier(); // reads COURIER_API_KEY
  await client.send.message({ message: { to: { user_id }, template, data } });
  await client.profiles.create('user_123', { profile: { email } });
  const { token } = await client.auth.issueToken({ scope: 'user_id:user_123 inbox:read:messages inbox:write:events', expires_in: '2 days' });
  ```
  Source: https://www.npmjs.com/package/@trycourier/courier, https://www.courier.com/docs/platform/sending/send-message/
- **Environments:** Production and Test environments, each with its own templates, integrations, keys, and logs. Key types are Published, Draft, and Mock. Mock keys simulate the full send without calling providers, but only on the **Enterprise** plan. Test's built-in email provider only delivers to the signup address. Source: https://courier.com/docs/platform/workspaces/environments-api-keys
- **Testing guidance:** The docs suggest mocking `@trycourier/courier-react` in Jest so that `useCourier()` returns fixture `inbox.feeds` and `totalUnreadCount`. Source: https://www.courier.com/docs/sdk-libraries/courier-react-web/
- **State model:** `InboxMessage` has `read`, `opened`, and `archived` as ISO timestamps, plus `tags`, `actions`, and `data`. Source: https://www.courier.com/docs/sdk-libraries/courier-react-web/
- **Identity:** A send does **not** create or update a profile, because inline `to` values apply "for that message only". `POST /profiles/{user_id}` is an upsert that merges, and `PUT` replaces. Source: https://www.courier.com/docs/platform/users/users-overview
- **Frontend auth:** A JWT is always required. Your backend calls the issue-token endpoint with the API key and a scope. Source: https://www.npmjs.com/package/@trycourier/courier-react

## MagicBell

- **Free tier:** "Builder", 1,000 deliveries per month, unlimited users and team members, 1 project. Startup is $249/mo with 50k deliveries and 5 projects, and extra projects cost $99. Source: https://www.magicbell.com/pricing
- **React SDK:** `@magicbell/react` provides `Provider` (`token` = **User JWT**, `toasts`), `FloatingInbox` (placement, size, `ButtonComponent`, `InboxComponent`), `Inbox` (`ItemComponent`, `onNotificationClick`), `InlineNotification`, and Slack buttons. Stylesheets are imported per component, for example `@magicbell/react/styles/inbox.css`. Source: https://www.npmjs.com/package/@magicbell/react
- **Styling:** Plain CSS. You override `--magicbell-*` variables (font, text, bg, surface, border, spacing) on `body` or `.magicbell--inbox`, and `.magicbell--*` class names. Because these are CSS variables, they can be pointed at shadcn tokens. Source: https://www.magicbell.com/docs/react/theme-customization
- **Preferences:** The `UserPreferences` component toggles channels per category, and its only listed option is `className`. The API has `GET/PUT /channels/user_preferences`. Sources: https://www.magicbell.com/docs/react/theme-customization, https://www.magicbell.com/docs/api/reference
- **Node SDK:** `magicbell-js`:
  ```ts
  import { Client } from 'magicbell-js/project-client';
  const client = new Client({ token: PROJECT_TOKEN });
  await client.broadcasts.createBroadcast({ title, content, recipients: [{ external_id }] });
  ```
  The broadcast API takes 1–1000 recipients. Sources: https://www.magicbell.com/docs/libraries/magicbell-js, https://www.magicbell.com/docs/primitive/broadcast
- **State model:** The v2 API has endpoints to mark read, unread, and seen, to archive and unarchive, and for mark-all-read, mark-all-seen, and archive-all. Source: https://www.magicbell.com/docs/api/reference
- **Identity:** `PUT /v2/users` saves a user, and creation is an upsert. `external_id` is immutable once set and takes precedence over email. Source: https://www.magicbell.com/docs/quick-start/choosing-an-identifier
- **Frontend auth:** User JWTs are generated on your backend from the project's Secret Key and API Key. Source: https://www.magicbell.com/docs/api/authentication
- **Environments:** No documented dev/prod environment separation was found. Keys are per project, and the free plan includes 1 project.

## SuprSend

- **Free tier:** 10,000 notifications per month, unlimited team members, unlimited channels, 30-day logs. Premium features are unlocked for a 30-day trial, then the account drops to Free. Over the limit, SuprSend keeps processing and asks you to upgrade. Essentials is $100/mo for 50k. Source: https://www.suprsend.com/pricing
- **React SDK:** `@suprsend/react`, built on `@suprsend/react-core`. `SuprSendProvider` takes `publicApiKey`, `distinctId` (the SDK "creates and authenticates the user"), `userToken`, `refreshUserToken`, `tenantId`, and `host`. Source: https://www.npmjs.com/package/@suprsend/react. The old `@suprsend/react-inbox` is end-of-support (https://docs.suprsend.com/docs/inbox-react).
- **Inbox and styling:** `<Inbox/>` props include `stores` (tabs), `pageSize`, `themeType` (dark/light), and `theme`, plus render slots: `bellComponent`, `badgeComponent`, `notificationComponent`, `headerRightComponent`, and others. Source: https://docs.suprsend.com/docs/react-in-app-feed. The theme is a nested object of `React.CSSProperties` (header, tabs, notification card, unseenDot, pinned, expiry, and more). Source: https://github.com/suprsend/suprsend-react-sdk/blob/main/docs/customising-feed.md, https://github.com/suprsend/suprsend-react-sdk/blob/main/src/Feed/interface.ts
- **State model:** `markAsRead`, `markAsUnread`, `markAsArchived`, `markAsInteracted`, automatic seen tracking (`disableAutomaticSeenTracking`), pinned notifications, and expiring notifications. Tabs can filter, for example with `{ archived: true }`. Source: https://github.com/suprsend/suprsend-react-sdk/blob/main/src/Feed/interface.ts
- **Node SDK:** `@suprsend/node-sdk`:
  ```js
  const supr = new Suprsend(workspaceKey, workspaceSecret);
  await supr.workflows.trigger(new WorkflowTriggerRequest({ workflow: 'slug', recipients: [{ distinct_id, $email: [...] }], data }, { idempotency_key }));
  ```
  It "doesn't require user creation before hand". Recipients can be defined inline (up to 100), and `is_transient` sends without creating a user. Source: https://www.npmjs.com/package/@suprsend/node-sdk
- **Environments:** Keys are unique per workspace (staging and production), and users are workspace-scoped. Account-level service tokens promote assets from staging to prod. Sources: https://docs.suprsend.com/docs/developer/api-keys, https://docs.suprsend.com/docs/best-practices-for-api-keys-management
- **Frontend auth:** Enhanced security mode uses an **ES256** JWT with `entity_type: "subscriber"`, `entity_id`, `exp`, `iat`, and an optional tenant `scope`, signed with a dashboard signing key. It is "recommended for production". Without it, public keys alone authenticate. Source: https://docs.suprsend.com/docs/client-authentication
- **Preferences:** Headless only for now. "Drop-in preference components are a work in progress." Source: https://github.com/suprsend/suprsend-react-sdk/blob/main/docs/preferences.md

## Test seam (all vendors)

None of these vendors documents a supported offline or fake mode for server-side triggers that works on a free plan. Courier's Mock keys are Enterprise-only and still make network calls. In every case the clean seam is inside Cadence:

- Put a single `notifications` module behind an interface such as `notify(userId, kind, data)`. The real implementation wraps the vendor SDK, and vitest injects an in-memory fake.
- Novu (`httpClient`) and Knock (`fetch`) also accept transport injection at the SDK level, so a test can assert that no request was made.

For the frontend, Courier's docs explicitly suggest mocking the React SDK module. For the others, you would mock the provider module the same way (inference, not documented).

## Best fit against criteria (not a final decision)

- **Novu** matches most of the Tailwind/shadcn and dev-demo criteria:
  - `appearance.elements` accepts Tailwind class strings and `variables` can map shadcn tokens.
  - Its free tier is generous: unlimited subscribers, a separate Dev env, and keyless demo mode.
  - Recipients are upserted inline on trigger.
  - HMAC is simple and opt-in.
  - A prebuilt Preferences UI is included.

  The limits are 3 team members, 5 workflows, and 24h activity retention on free.
- **Knock** has the cleanest state model (seen/read/interacted/archived with timestamps), a well-documented transport seam (`fetch`), inline identify, unlimited environments and seats on free, and CSS-variable theming. It has no prebuilt preferences UI, and the paid jump to $250/mo is steep.
- **Courier** has strong prebuilt components, including `<CourierPreferences/>`, and a documented frontend mocking pattern. However, it always needs a JWT (even with DevUI fake users), styling goes through JS theme objects rather than classes or CSS variables, and profiles aren't created on send.
- **MagicBell** has the weakest fit for dev/demo. Free is 1,000 deliveries and 1 project with no documented env split, and a JWT is always required. Its CSS-variable theming and prebuilt `UserPreferences` are good, though.
- **SuprSend** fits on free-tier volume, staging/prod workspaces, inline recipients, and the richest state model (pinned, expiry). Styling is inline-style objects (least Tailwind-friendly), and preferences UI is headless only.

For the DevUI fake-user flow: Novu, Knock and SuprSend can run the inbox in dev with only a public key and user ID, while Courier and MagicBell need a server-minted JWT even in dev.

## Unverified / caveats

- The pricing pages were read through an automated fetch, which summarises rendered page text. Tier names and numbers should be rechecked in a browser before committing. The SuprSend environment row on Free was ambiguous on the page. Courier's page doesn't explicitly say whether Inbox-only messages count as sends. It implies they do.
- MagicBell:
  - The User JWT claim names and algorithm (a blog post shows HS256 with `user_email`, `user_external_id`, and `api_key`) were **not** confirmed on an official docs page, because the auth page only says "Secret Key and API Key".
  - Whether a broadcast to an unknown `external_id` auto-creates the user was not confirmed.
  - The absence of dev/prod environments is inferred from not finding them.
  - `@magicbell/react` 1.14.0 declares no React peer dependency, which is unusual. Check what it actually renders with before relying on it.
- Courier: no `fetch` or `baseURL` override was verified for `@trycourier/courier`. It looks like a generated SDK similar to Knock's, which is an inference only. Courier's environments doc moved (one URL 404'd), and the details come from `courier.com/docs/platform/workspaces/environments-api-keys` via search.
- Knock: the docs page for message statuses 404'd, and the state details come from the feeds overview, Messages API reference, and MessageClient pages. The `usePreferences` hook reference page itself wasn't read.
- SuprSend: the Node SDK README on npm was the source for the trigger shape. A transport or host override for the Node SDK wasn't checked. Whether staging workspaces enforce enhanced security isn't stated.
- Novu: the props are named inconsistently in the docs (`subscriber` vs `subscriberId`), so check against `@novu/react` 3.19.x types.
- "Email channel: Yes" for all five is based on their docs referencing email providers and channels, for example Novu preferences, Courier Test email, MagicBell SendGrid provider docs, and SuprSend email attachments. Free-tier email limits and bring-your-own-provider requirements were not compared.
