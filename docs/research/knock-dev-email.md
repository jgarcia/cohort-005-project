# Knock-sent email in development and tests without Postmark

## Question

Cadence will send Notification email through Knock, with Postmark connected as Knock's email provider ([#16](https://github.com/jgarcia/cohort-005-project/issues/16)). Today `app/lib/mailer.server.ts` writes mail to `.outbox/` as JSON when `POSTMARK_SERVER_TOKEN` is unset. In Knock's Development environment, what options exist for email without a real provider? What does the free plan allow, and how is Postmark configured per environment? ([#22](https://github.com/jgarcia/cohort-005-project/issues/22))

This document gathers facts. It does not choose an approach.

Read on **2026-11-13** from docs.knock.app, knock.app/pricing, and postmarkapp.com. Nothing was signed up for and no keys were used.

## Summary

- Knock **channels** (provider integrations such as Postmark) live at the account level. Each channel's provider settings, overrides, and conditions are set **per environment**.
- Every channel except in-app supports **sandbox mode**. A sandboxed channel renders the message and shows it in the dashboard, but never calls the provider. A sandboxed environment config **can be saved without provider credentials**. That means the Development environment can have a Postmark channel with no Postmark API key.
- Sandbox mode can also be forced **per trigger** (`settings.sandbox_mode: true` on the trigger API) or **per test run** (workflow test runner).
- Sandboxed messages get status **"Not sent"**, are viewable (rendered) in the dashboard and via `GET /v1/messages/{id}/content`, and **do not count toward usage**.
- Knock also ships a built-in **"Knock test" email channel**. It is limited to 100 emails/month and only to email addresses of Knock account members. It is testing-only and can't be used in production.
- Free plan: 10,000 messages/month, unlimited environments, unlimited team members, 30-day log retention. Email client previews are not on Free.

## Findings

### 1. Channels are account-level, configured per environment

> "Unlike most parts of the Knock model, your integrations live at the account-level." … "Its provider settings, overrides, and conditions are set per environment."
> — https://docs.knock.app/integrations/overview

> "A common example is to add the suffix "(dev)" to the "From name" on all emails sent in your development environment." … "you can use the **Copy from...** menu on an environment's row to duplicate another environment's configuration."
> — https://docs.knock.app/integrations/overview

Workflow email steps point at a specific channel. To move from the Knock test channel to a real provider, the docs say to "change the channel on each of your existing email steps to use the new provider, then publish your workflows … If you've enabled environments, commit the changes and promote them to production." (https://docs.knock.app/integrations/email/knock-test, FAQ)

Implication (inference, not stated in one sentence by the docs): if the email steps use a single Postmark channel, Development and Production can share workflows and only that channel's per-environment config differs.

### 2. Sandbox mode

> "Sandbox mode enables you to generate and preview messages for a given channel without delivering them. When sandbox is enabled, Knock will never send the request to your downstream provider, blocking all delivery. To gate delivery selectively rather than suppress it entirely, use channel conditions instead. Sandbox mode is supported across all channel types (except for in-app) and can be enabled under Advanced in a channel's environment settings. Because sandbox mode never calls your provider, you can save an environment's configuration in sandbox mode without provider credentials. You'll need to add them before you turn sandbox mode off."
> — https://docs.knock.app/integrations/overview#sandbox-mode

> "If sandbox mode is enabled for a channel, Knock skips execution entirely and channel conditions are not evaluated."
> — https://docs.knock.app/integrations/overview

Message status for sandboxed messages:

> "5) Not sent — Your message was processed successfully but was not sent to the downstream provider because your channel is in sandbox mode."
> — https://docs.knock.app/send-notifications/message-statuses

Usage and billing:

> "When a channel is in sandbox mode, Knock does not pass messages downstream for delivery. Sandboxed messages are rendered for preview in the Knock dashboard, but do not count toward usage." … "a sandboxed channel doesn't deliver to anyone in that environment, so only do this in an environment you use for testing."
> — https://docs.knock.app/manage-your-account/knock-plans

The Postmark integration lists "Per environment configuration" and "Sandbox mode" among its features, with an Advanced setting "Sandbox mode (boolean) – Whether to enable sandbox mode for your Postmark channel." (https://docs.knock.app/integrations/email/postmark)

### 3. Per-trigger and per-test-run sandbox

Trigger API body:

> "`settings.sandbox_mode` boolean — When set to true, overrides the sandbox mode for all channels in this workflow run, messages are not delivered to the underlying providers. If false or not set, the workflow delivers messages normally." (A sibling `settings.skip_delay` skips delay steps.)
> — https://docs.knock.app/api-reference/workflows/trigger

Dashboard workflow test runner:

> "Sandbox mode. When enabled, all messages sent from the workflow are forced to send in sandbox mode. Knock generates and previews the messages without delivering them to the underlying providers, regardless of how sandbox mode is configured on each channel." … "You can also apply both of these settings when triggering a workflow via the API using the `settings.sandbox_mode` and `settings.skip_delay` properties, which is useful when testing workflows programmatically."
> — https://docs.knock.app/send-notifications/testing-workflows

The test runner "uses the last saved version of the workflow, not the last committed version", while API triggers "always use the last committed version". (same page)

### 4. Channel conditions (allow-listing recipients)

> "You can use channel conditions to place a condition on all instances of a channel within a given environment. As an example, if you want to ensure that your email channel only sends to recipients from your domain when it's executing in your staging environment, a channel-level condition would be great way to do that." Channel conditions are ANDed with step conditions.
> — https://docs.knock.app/integrations/overview

> "Unlike sandbox mode, channel conditions gate delivery selectively rather than suppress it entirely. Any message that satisfies a channel condition may contribute to usage."
> — https://docs.knock.app/manage-your-account/knock-plans

The docs don't say whether a message skipped by a channel condition still shows up in the message log with rendered content. Per the Knock test page, when conditions aren't met "the step is skipped".

### 5. Built-in "Knock test" email channel

> "Knock comes with a built-in email channel to test your email notifications." … "This provider is for testing purposes only. Sending is limited to email addresses associated with the members of your Knock account." Features: "100 emails per month", attachments, delivery tracking, bounce support, Knock link/open tracking, per environment configuration, sandbox mode. "By default, all new Knock accounts will have the channel enabled and ready to use across all environments with no additional configuration required." Sending to a non-member gives `knock_recipient_not_allowed`. Over the limit, emails "will be marked as undelivered". It can't be used for production.
> — https://docs.knock.app/integrations/email/knock-test

The page doesn't say whether Knock test sends count toward the plan's 10k message usage.

### 6. Seeing rendered email without delivery

- Message log: the dashboard shows "A preview of the message content as displayed for the recipient", the triggering request, provider request logs, and a lifecycle timeline. — https://docs.knock.app/concepts/messages
- API: `GET /v1/messages/{message_id}/content` "Returns the fully rendered contents of a message, where the response depends on which channel the message was sent through." — https://docs.knock.app/api-reference/messages/get_content
- Template editor: "The preview pane in the template editor will show you an approximation of how your template will render", with "Run a test" for single-step or whole-workflow tests. — https://docs.knock.app/template-editor/testing-and-debugging
- Retention: message log data is kept 30 days on non-Enterprise plans (90 on Enterprise). — https://docs.knock.app/manage-your-account/data-retention

### 7. Free plan

From https://knock.app/pricing and https://docs.knock.app/manage-your-account/knock-plans:

- "Free plan (formerly known as our Developer plan)". Up to 10,000 messages/month included. The pricing page says bounced/failed messages aren't counted. Sandboxed messages don't count toward usage (knock-plans page).
- Unlimited environments ("Create as many environments as you need"), unlimited team members, unlimited channels.
- 30-day log retention.
- Email **client previews** (rendering across mail clients) are not included on Free.
- Knock doesn't bill for downstream providers. Postmark is billed separately.

### 8. Environments

> "Your Knock account starts with a single environment: production. Enabling environments adds a development environment where you can build and test changes before you promote them to production." … "Each environment has its own set of API keys". "You can't turn environments off after you enable them."
> — https://docs.knock.app/version-control/environments

So per the docs a Production environment always exists once the account exists. "Production isn't set up" probably means its channels and keys aren't configured yet, not that the environment is missing. None of the email/sandbox pages read here mention enhanced security. Its effect on email wasn't researched further.

### 9. Postmark configuration in Knock

Per environment, required fields: "API key (string*) – The API key for your Postmark server" and "From email address (string | liquid*)". Optional fields: "Incoming webhook" (delivery status via Postmark webhook), Knock and Postmark open/link tracking, sandbox mode, overrides, and conditions. "Knock does not target a specific `MessageStream`". Postmark uses its default transactional stream unless a payload override sets `MessageStream`.
— https://docs.knock.app/integrations/email/postmark

The "API key" here is a Postmark **server** token (Postmark's send API authenticates with `X-Postmark-Server-Token`). The Knock page just says "API key for your Postmark server".

### 10. Postmark-side test options (for reference)

- Postmark's test token: send with `X-Postmark-Server-Token: POSTMARK_API_TEST` and messages are validated but not delivered. — https://postmarkapp.com/developer/api/overview
- Postmark sandbox servers don't deliver to real inboxes, but "emails sent through Sandbox Servers do count towards your monthly sending volume." — https://postmarkapp.com/developer/user-guide/sandbox-mode
- While a Postmark account is pending approval, "all recipient addresses must share the same domain as the From address." — https://postmarkapp.com/developer/api/overview

**Unclear:** Knock's docs don't say whether `POSTMARK_API_TEST` is accepted as the Knock Postmark "API key". Knock sandbox mode makes it unnecessary anyway, because no provider call happens.

### 11. Other providers with a test inbox

Knock supports Mailtrap with an "API (Sending or Testing)" switch and an "Inbox ID… Required when using the Testing API". That would route Development email into a Mailtrap test inbox, at the cost of another provider account. — https://docs.knock.app/integrations/email/mailtrap

## Relevance to Cadence

- **Local dev with no Postmark token at all:** set the Postmark channel's Development config to sandbox mode with no API key (documented as allowed). Triggers from local dev then render in Knock, show as "Not sent", are viewable in the dashboard or via the message content API, and don't count toward usage. Local dev still needs a Knock Development API key to trigger at all.
- **Real inbox in dev:** either turn sandbox off on Development with a Postmark token, plus a channel condition limiting recipients to an own domain, or point a step at the Knock test channel (account members only, 100/month). The Knock test channel option means a different channel on the step than Production uses.
- **Automated tests:** the docs offer `settings.sandbox_mode` per trigger for programmatic tests against a real Knock environment. No offline/local Knock emulator is documented, so tests that must not touch the network would still need a faked Knock client (separate ticket).
