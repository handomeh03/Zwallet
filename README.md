# 💳 ZWallet

> **A Safer Digital Wallet for Person-to-Person Transfers**

**ZWallet** is a fintech e-wallet application designed to make person-to-person money transfers **safer, clearer, and more reliable**.

The platform introduces an additional confirmation layer for transfers by requiring **voice verification of the recipient's name** before settlement, while prominently displaying the recipient's identity before the sender confirms the transaction.

ZWallet also integrates with **JoPACC's sandbox Open Banking APIs** to model a realistic pooled-custody flow where customer funds move through the application's settlement bank account.

---

# ✨ Key Features

### 🔐 Voice-Verified Transfers

ZWallet adds an additional protection layer before completing a transfer.

Before the transaction is settled, the sender must:

* Review the recipient's identity.
* Confirm the recipient's name.
* Say the recipient's name aloud.
* Complete the transfer after successful verification.

This helps reduce accidental transfers caused by selecting or entering the wrong recipient.

---

### 👤 Recipient Identity Confirmation

The recipient's identity is displayed clearly before the user confirms a transfer.

```text
┌──────────────────────────────────┐
│        Confirm Transfer          │
├──────────────────────────────────┤
│                                  │
│  Sending to                      │
│                                  │
│  👤 Ahmad Al-Hassan              │
│     IBAN: JO••••••••••1234      │
│                                  │
│  Amount                          │
│  💰 50.00 JOD                    │
│                                  │
│  🎙️ Say recipient's name        │
│                                  │
│          [ Confirm ]             │
│                                  │
└──────────────────────────────────┘
```

---

### 🏦 Open Banking Integration

ZWallet integrates with **JoPACC's sandbox Open Banking APIs** to simulate realistic banking operations.

Supported operations include:

* 🔗 Bank account linking
* 💰 Balance verification
* 🔎 IBAN confirmation
* 💸 Payment initiation
* 🔄 External transfers
* 🏦 Settlement account operations

---

### 💰 Customer Top-Ups

Customers can add money to their ZWallet balance using their linked bank account.

```text
Customer Bank Account
        │
        │ PIS
        ▼
┌───────────────────┐
│ ZWallet Settlement│
│   Bank Account    │
└─────────┬─────────┘
          │
          ▼
    Wallet Balance
```

The wallet balance increases only after the payment reaches an **Accepted** state.

---

### 💸 External Transfers

When a customer sends money to an external bank account, ZWallet uses its settlement account as the underlying debtor account.

```text
ZWallet Customer
       │
       │ Transfer Request
       ▼
┌────────────────────┐
│ ZWallet Settlement │
│    Bank Account    │
└─────────┬──────────┘
          │
          │ PIS
          ▼
┌────────────────────┐
│   Recipient Bank   │
│       IBAN         │
└────────────────────┘
```

The customer's identity is attributed through the payment's `remittanceInformation`, even though the underlying bank account belongs to the application's settlement account.

---

### 🔄 Internal Transfers

Transfers between two ZWallet users are handled entirely through the internal wallet ledger.

**No external PIS call is required.**

```text
User A Wallet
     │
     │ Internal Transfer
     ▼
User B Wallet
```

This allows internal transfers to remain within the ZWallet ecosystem.

---

# 🔄 Core Workflow

```text
┌─────────────────────┐
│   Create Account    │
│       / Login       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     Link Bank       │
│       Account       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│       Top-Up        │
│ Bank → Settlement   │
│ Account → Wallet    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Choose Recipient  │
│  & Transfer Amount  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Recipient Identity  │
│     Confirmation    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Voice Verification │
│    🎙️ Say Name      │
└──────────┬──────────┘
           │
           ▼
      ┌────┴─────┐
      │ Transfer │
      │ Confirmed│
      └────┬─────┘
           │
      ┌────┴──────────┐
      ▼               ▼
 Internal          External
 Transfer          Transfer
      │               │
      ▼               ▼
 Internal          JoPACC PIS
 Ledger            Settlement
```

---

# 🏗️ System Architecture

```text
                    ┌────────────────────┐
                    │    React Frontend  │
                    │   Vite + TypeScript│
                    └─────────┬──────────┘
                              │
                              │ REST API
                              ▼
                    ┌────────────────────┐
                    │    NestJS Backend  │
                    │     TypeScript     │
                    └─────────┬──────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌────────────┐ ┌────────────┐ ┌─────────────┐
        │ PostgreSQL │ │   Prisma   │ │   JoPACC    │
        │            │ │    ORM     │ │ Open Banking│
        └────────────┘ └────────────┘ └──────┬──────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │  Bank APIs  │
                                      │  Accounts   │
                                      │  CAF        │
                                      │  Balances   │
                                      │  PIS        │
                                      └─────────────┘
```

---

# 🧩 Transfer Types

| Transfer Type        | External API | Settlement Account | Internal Ledger |
| -------------------- | -----------: | -----------------: | --------------: |
| 🏠 Internal Transfer |            ❌ |                  ❌ |               ✅ |
| 💰 Customer Top-Up   |        ✅ PIS |                  ✅ |               ✅ |
| 💸 External Transfer |        ✅ PIS |                  ✅ |               ✅ |

---

# 🏦 Admin / Settlement Account

ZWallet uses a dedicated **ADMIN** user to represent the application's pooled settlement bank account.

Each user has one of the following roles:

```text
ADMIN
CUSTOMER
```

Exactly one `ADMIN` user should exist.

The admin represents the application's settlement account and is used as the underlying bank account for external money movement.

Initialize the admin account with:

```bash
npm run seed:admin
```

The command is **idempotent** and safe to run multiple times.

---

# 🛠️ Tech Stack

### 🎨 Frontend

<p>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white" />
  <img src="https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
</p>

### ⚙️ Backend

<p>
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
</p>

### 🗄️ Database

<p>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
</p>

### 🏦 Financial Integration

**JoPACC Open Banking Sandbox**

* Accounts API
* Balances API
* Confirmation of Availability of Funds (CAF)
* IBAN Confirmation
* Payment Initiation Service (PIS)

---

# 🚀 Getting Started

## 1️⃣ Clone the Repository

```bash
git clone <repository-url>
cd zwallet
```

---

# ⚙️ Backend Setup

```bash
cd backend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Build the backend:

```bash
npm run build
```

Initialize the admin / settlement account:

```bash
npm run seed:admin
```

Start the development server:

```bash
npm run start:dev
```

Backend:

```text
http://localhost:3000
```

API prefix:

```text
/api
```

---

# 🎨 Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🔐 Environment Variables

ZWallet requires environment variables for the frontend, backend, database, authentication, and JoPACC integration.

> ⚠️ **Never commit real `.env` files containing passwords, API tokens, database credentials, JWT secrets, or private keys.**

---

## 🎨 Frontend `.env`

Create:

```text
frontend/.env
```

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

The frontend uses `VITE_API_BASE_URL` to communicate with the backend API.

---

## ⚙️ Backend `.env`

Create:

```text
backend/.env
```

Use the following structure and replace the placeholder values with your own credentials:

```env
# ==============================
# Database
# ==============================

DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"


# ==============================
# Application
# ==============================

PORT=3000


# ==============================
# Authentication
# ==============================

JWT_SECRET="your-secure-jwt-secret"
JWT_EXPIRES_IN="7d"


# ==============================
# JoPACC Sandbox APIs
# ==============================

JOPACC_AUTH_TOKEN="your-jopacc-auth-token"

JOPACC_ACCOUNTS_BASE_URL="http://jpcjofsdev.apigw-az-eu.webmethods.io/gateway/Accounts/v0.4.3"

JOPACC_BALANCES_BASE_URL="https://jpcjofsdev.apigw-az-eu.webmethods.io/gateway/Balances/v0.4.3"

JOPACC_CAF_BASE_URL="https://jpcjofsdev.apigw-az-eu.webmethods.io/gateway/Confirmation of Availability of Funds/v0.4.3"

JOPACC_IBAN_CONFIRMATION_BASE_URL="https://jpcjofsdev.apigw-az-eu.webmethods.io/gateway/IBAN Confirmation/v0.4.3"

JOPACC_PIS_BASE_URL="https://jpcjofsdev.apigw-az-eu.webmethods.io/gateway/RFC - Payment Initiation Services (PIS)/v0.4.3"

JOPACC_FINANCIAL_ID="your-financial-id"

JOPACC_CUSTOMER_USER_AGENT="ZWallet-Backend/1.0"


# ==============================
# JWS Signing
# ==============================

JWS_SIGNING_PRIVATE_KEY_PATH="./.jws-keys/private.pem"

JWS_SIGNING_PUBLIC_KEY_PATH="./.jws-keys/public.pem"

JWS_SIGNING_KEY_ID="zwallet-mock-1"


# ==============================
# Admin / Settlement Account
# ==============================

ADMIN_EMAIL="admin@zwallet.local"

ADMIN_PASSWORD="your-secure-admin-password"

ADMIN_SETTLEMENT_IBAN="your-settlement-iban"
```

---

# 🔑 Environment Variables Overview

| Variable                            | Purpose                                   |
| ----------------------------------- | ----------------------------------------- |
| `DATABASE_URL`                      | PostgreSQL database connection            |
| `PORT`                              | Backend server port                       |
| `JWT_SECRET`                        | Secret used for JWT signing               |
| `JWT_EXPIRES_IN`                    | JWT expiration duration                   |
| `JOPACC_AUTH_TOKEN`                 | Authentication token for JoPACC sandbox   |
| `JOPACC_ACCOUNTS_BASE_URL`          | JoPACC Accounts API                       |
| `JOPACC_BALANCES_BASE_URL`          | JoPACC Balances API                       |
| `JOPACC_CAF_BASE_URL`               | Confirmation of Availability of Funds API |
| `JOPACC_IBAN_CONFIRMATION_BASE_URL` | IBAN Confirmation API                     |
| `JOPACC_PIS_BASE_URL`               | Payment Initiation Service API            |
| `JOPACC_FINANCIAL_ID`               | TPP financial identifier                  |
| `JOPACC_CUSTOMER_USER_AGENT`        | Client identification                     |
| `JWS_SIGNING_PRIVATE_KEY_PATH`      | JWS private signing key                   |
| `JWS_SIGNING_PUBLIC_KEY_PATH`       | JWS public signing key                    |
| `JWS_SIGNING_KEY_ID`                | JWS signing key identifier                |
| `ADMIN_EMAIL`                       | ZWallet admin account                     |
| `ADMIN_PASSWORD`                    | Admin account password                    |
| `ADMIN_SETTLEMENT_IBAN`             | Application settlement bank account       |

---

# 🛡️ Security

Make sure the following files are included in `.gitignore`:

```gitignore
# Environment files
.env
.env.*
!.env.example

# Generated JWS keys
.jws-keys/

# Dependencies
node_modules/

# Build output
dist/
build/
```

This allows the project to contain safe `.env.example` files while keeping sensitive credentials private.

---

# ⚠️ Known JoPACC Sandbox Behavior

During the integration with the JoPACC sandbox, several important behaviors were identified.

### 🔹 PIS Debtor Information

The sandbox expects **creditor-side information only** for PIS requests.

The following debtor-side fields should not be included:

```text
dbtr
dbtrAcct
dbtrAgt
```

The debtor is treated as implicit by the sandbox.

---

### 🔹 Account Lock Flags

The following flags:

```text
lockedForDebit
lockedForCredit
```

do not prevent PIS transactions in the tested sandbox scenarios.

They mainly affect Accounts and CAF lookups.

---

### 🔹 Sandbox Account Balances

The sandbox test data contains an unusual relationship between account balances and lock flags.

Accounts with available funds may have lock flags enabled, while fully unlocked accounts may have zero balances.

Since the tested PIS flow does not block transactions based on those lock flags, this does not prevent the current integration.

---

### 🔹 Balances API

The Balances API requires:

```text
HTTPS
```

and the `/balances` path suffix.

---

### 🔹 IBAN Confirmation

IBAN Confirmation requires:

```text
GET
```

with the IBAN supplied through the:

```text
accountId
```

header.

---

### 🔹 Required Identification Headers

JoPACC APIs require a common set of identification headers:

```text
x-financial-id
x-customer-id
x-interactions-id
x-idempotency-key
x-auth-date
x-customer-ip-address
x-customer-user-agent
```

These headers are centralized inside:

```text
backend/src/jopacc-client/jopacc-client.service.ts
```

through:

```text
buildCustomerHeaders()
```

---

# 🧠 Financial Flow

ZWallet models three primary financial flows.

## 💰 Top-Up

```text
Customer Bank Account
          │
          │ PIS
          ▼
   ZWallet Settlement
      Bank Account
          │
          ▼
    Customer Wallet
```

The wallet balance is increased only after the PIS transaction reaches:

```text
Accepted
```

---

## 💸 External Transfer

```text
Customer
    │
    │ Transfer Request
    ▼
ZWallet Wallet
    │
    ▼
Settlement Bank Account
    │
    │ PIS
    ▼
Recipient IBAN
```

The payment is attributed to the sending customer through `remittanceInformation`.

---

## 🔄 Internal Transfer

```text
Customer A
    │
    │ Internal Ledger
    ▼
Customer B
```

No external banking API is required.

---

# 🎯 Project Goals

### 🛡️ Safer Transfers

Reduce accidental transfers through recipient identity confirmation and voice verification.

### 🏦 Realistic Fintech Architecture

Model realistic banking and settlement flows instead of treating the wallet as a simple balance table.

### 🔗 Open Banking Integration

Connect the application with banking infrastructure through Open Banking APIs.

### ⚡ Reliable Transactions

Update wallet balances only after successful payment processing.

### 🧩 Clear Financial Separation

Separate internal wallet operations from external banking transactions.

### 🔐 Secure Authentication

Use JWT-based authentication and protected backend resources.

---

# 🚀 Future Improvements

* 📱 React Native mobile application
* 🔔 Real-time transaction notifications
* 🔐 Biometric confirmation
* 📊 Advanced transaction analytics
* 💳 Virtual cards
* 🧾 Digital transaction receipts
* 🔄 Transaction retry and reconciliation
* 🏦 Support for additional banking providers
* 📈 Advanced admin financial dashboard
* 🔍 Fraud detection and risk scoring
* 🛡️ Transaction limits
* 📜 Complete audit logging
* 🔔 Push notifications
* 📱 Mobile banking experience

---

# 📁 Project Structure

```text
ZWallet/
│
├── backend/
│   ├── src/
│   │   ├── jopacc-client/
│   │   └── ...
│   ├── prisma/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

# 💡 The Core Idea

Traditional bank transfers often depend on the sender correctly entering or selecting the recipient's information.

**ZWallet introduces an additional confirmation step before money moves:**

> **"Is this really the person you intended to send money to?"**

By combining:

**Recipient Identity + Voice Verification + Internal Wallet Ledger + Open Banking**

ZWallet aims to make person-to-person transfers **safer, clearer, and more transparent**.

---

<div align="center">

## 💳 Verify. Confirm. Transfer. Safely.

### ZWallet

**Making person-to-person payments safer.**

<br />

⭐ *Built with NestJS, React, PostgreSQL & JoPACC Open Banking*

</div>
