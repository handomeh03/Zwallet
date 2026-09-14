# ZWallet

An e-wallet app for safer person-to-person transfers: confirmed transfers are voice-verified (say the
recipient's name aloud) before settling, and the recipient's identity is shown prominently before you
confirm. Bank accounts are linked via JoPACC's sandbox Open Banking APIs, and the app models a real
pooled-custody flow: customer top-ups and outgoing external transfers move real money to/from the app's
own admin/settlement bank account.

## Stack

- **Backend**: NestJS + TypeScript, PostgreSQL via Prisma (`backend/`)
- **Frontend**: React + Vite + TypeScript, React Router, TanStack Query, Tailwind CSS (`frontend/`)

## Setup

### Backend

```bash
cd backend
npm install
# copy .env.example to .env and fill in DATABASE_URL (a Postgres connection string)
npx prisma migrate dev
npm run build
npm run seed:admin   # one-time: designates the admin/settlement account (see below)
npm run start:dev
```

Runs on `http://localhost:3000`, all routes under `/api`.

### Frontend

```bash
cd frontend
npm install
# copy .env.example to .env if VITE_API_BASE_URL needs to differ from the default
npm run dev
```

Runs on `http://localhost:5173` (or next free port).

## Admin / settlement account

Every `User` has a `role` (`ADMIN` or `CUSTOMER`, default `CUSTOMER`). Exactly one `ADMIN` user should
exist — it represents the app's own pooled bank account. `npm run seed:admin` (idempotent, safe to
re-run) creates that user (`ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`, defaults `admin@zwallet.local` /
`ChangeMe123!`) and links the fixed settlement IBAN (`ADMIN_SETTLEMENT_IBAN`, default
`JO27CBJO0000000000000000001001`) to them via the real Accounts API — the same path a customer uses to
link their own account.

- **Top-up**: customer's own linked account (debtor, implicit — not sent to JoPACC) → admin/settlement
  account (creditor), via a real PIS call. Wallet balance only increases on `Accepted`.
- **External transfer** (pay someone by IBAN): admin/settlement account (debtor, implicit) → recipient's
  IBAN (creditor), via PIS — attributed to the sending customer's name in `remittanceInformation`, even
  though the underlying bank account is the admin's.
- **Internal transfer** (another ZWallet user): unchanged, pure internal ledger, no PIS call.

## Known JoPACC sandbox quirks

- **PIS only accepts creditor-side info** — no `dbtr`/`dbtrAcct`/`dbtrAgt` entry at all. Sending *any*
  debtor-side entry (even a well-formed one) makes the sandbox fail every single request with a generic
  `500 internal.server.error`, regardless of which accounts are involved or their status. Confirmed
  empirically (dry-testing the raw PIS endpoint with/without a `dbtr` entry, and with intentionally wrong
  `x-customer-id` values — the debtor side is simply not read/validated by this sandbox at all). The
  debtor is entirely implicit; only `involvedParties`/`accounts`/`agents` for the **creditor** are sent.
  `agents[].agentType` itself only accepts `cdtrAgt` / `InstdAgt` / `InitgPty` (no `dbtrAgt`), which is
  moot now that no debtor agent is sent either way.
- **Account lock flags (`lockedForDebit`/`lockedForCredit`) do not actually affect PIS** in this sandbox —
  confirmed by successfully completing a PIS call against a `lockedForCredit: true` creditor account once
  the `dbtr`/`dbtrAcct` entries were removed. (An earlier version of this doc claimed lock flags caused
  PIS failures — that was a false correlation: every case tested at the time happened to also include a
  `dbtr` entry.) CAF still checks the *debtor* account's real balance before a top-up proceeds, so
  `lockedForDebit`/`lockedForCredit` mainly affect the plain Accounts/CAF lookups, not PIS itself.
- **Test account balances vs. lock flags are inversely correlated in this sandbox's seed data**: every
  account with a non-zero `availableBalance` (checked up to accountId 1100) has `lockedForCredit: true` or
  `lockedForDebit: true` set, and every fully-unlocked account has a zero balance. Since lock flags don't
  block PIS (see above), this is no longer an obstacle — a `lockedForCredit: true` account with funds
  works fine as a top-up's debtor now that the payload doesn't reference the debtor at all.
- **Balances API** requires `https` (not `http`) and a `/balances` path suffix.
- **IBAN Confirmation** requires `GET` (not `POST`), IBAN passed via the `accountId` header.
- **Accounts / CAF / IBAN Confirmation / PIS** all require the identification headers seen in the
  provider's Postman collection (`x-financial-id`, `x-customer-id`, `x-interactions-id`,
  `x-idempotency-key`, `x-auth-date`, `x-customer-ip-address`, `x-customer-user-agent`) — centralized in
  `backend/src/jopacc-client/jopacc-client.service.ts`'s `buildCustomerHeaders()`.
