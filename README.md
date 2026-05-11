# Budget

Personal budget web app connecting to CIC bank (France) via GoCardless Open Banking. Visualises transactions, supports tagging, and charts spend by category.

## Stack

| Layer | Choice |
|---|---|
| Frontend + API | Next.js 15 (App Router) |
| Database | Supabase (Postgres) |
| Hosting | Netlify |
| Bank data | GoCardless Open Banking (PSD2, free tier) |

## Key Decisions

### Bank connector abstraction
All bank API calls go through `src/lib/bank/connector.ts` (interface) + `src/lib/bank/gocardless.ts` (implementation). To swap providers: create a new implementation file, update one import in the sync route.

### Tag system
Tags belong to categories. A transaction can have one tag per category.
- Example category `scope`: personal, couple
- Example category `concern`: food, energy, transport
- Charts tab shows one pie chart per category

### Manual spending entry
User can enter a spending manually before the bank transaction appears (card payments take days). Stored as `source: 'manual'`. When a bank transaction arrives with a matching amount, the UI suggests "Associate & delete manual entry". On confirm: tags are copied from the manual entry to the bank transaction, then the manual entry is deleted.

### Auto-sync
Netlify Scheduled Function fires every 6h (`0 */6 * * *` in `netlify/functions/sync.ts`). The schedule lives in one place only — no env var for it. The app displays "Last synced [datetime]" stored in Supabase `app_state`.

### Push notifications
PWA with Web Push API. After each sync, if new untagged transactions are found, a push notification is sent. Push subscriptions are stored in `push_subscriptions`.

### No auto-merge of manual entries
When a bank transaction arrives, the match is suggested but the user confirms manually. No automatic deduplication.

## Database Schema

```sql
tag_categories   (id, name)
tags             (id, name, color, category_id → tag_categories.id)
transaction_tags (transaction_id, tag_id)
transactions     (id, external_id UNIQUE nullable, date, amount, currency, description, source: 'bank'|'manual')
push_subscriptions (id, subscription jsonb)
app_state        (key, value)  -- stores last_synced_at
```

Migration: `supabase/migrations/20260511083143_initial_schema.sql`

## Setup

### 1. Supabase

Create a project at [supabase.com](https://supabase.com), then run:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### 2. GoCardless

Create an account at [bankaccountdata.gocardless.com](https://bankaccountdata.gocardless.com), create credentials, then link your CIC bank account. Copy the account ID.

### 3. VAPID keys

```bash
npx web-push generate-vapid-keys
```

### 4. Environment variables

Copy `.env.local.example` → `.env.local` and fill in all values.

For Netlify, add the same variables in Site settings → Environment variables. Note: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` must equal `VAPID_PUBLIC_KEY` (same value, different names — one is exposed to the browser).

### 5. Run locally

```bash
npm run dev
```

### 6. Deploy

Push to your Git remote. Netlify will build automatically via `@netlify/plugin-nextjs`.

## PWA icons

Add `public/icon-192.png` and `public/icon-512.png` before deploying for full PWA support.
