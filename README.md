# 💳 ZWallet

> **A Safer Digital Wallet for Person-to-Person Transfers**

**ZWallet** is a fintech e-wallet application designed to make person-to-person money transfers **safer, clearer, and more reliable**.

The platform introduces an additional confirmation layer for transfers by requiring **voice verification of the recipient's name** before settlement, while prominently displaying the recipient's identity before the sender confirms the transaction.

ZWallet also integrates with **JoPACC's sandbox Open Banking APIs** to simulate a real-world pooled-custody flow where customer funds move through the application's settlement bank account.

---

# ✨ Key Features

### 🔐 Voice-Verified Transfers

ZWallet adds an extra layer of protection before completing a transfer.

Before the transaction is settled, the sender is required to:

* Review the recipient's identity.
* Confirm the recipient's name.
* Say the recipient's name aloud.
* Complete the transfer only after successful confirmation.

This helps reduce mistakes caused by sending money to the wrong person or account.

---

### 👤 Recipient Identity Confirmation

The recipient's identity is displayed clearly before the user confirms a transfer.

```text
┌──────────────────────────────────┐
│        Confirm Transfer          │
├──────────────────────────────────┤
│                                  │
│  Sending to                       │
│                                  │
│  👤 Ahmad Al-Hassan               │
│     IBAN: JO••••••••••1234       │
│                                  │
│  Amount                           │
│  💰 50.00 JOD                     │
│                                  │
│  🎙️ Say recipient's name         │
│                                  │
│          [ Confirm ]              │
│                                  │
└──────────────────────────────────┘
```

---

### 🏦 Open Banking Integration

ZWallet integrates with **JoPACC's sandbox Open Banking APIs** to model realistic banking operations.

The application supports:

* 🔗 Bank account linking
* 💰 Account balance verification
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

The wallet balance is increased only after the payment is successfully **Accepted**.

---

### 💸 External Transfers

When a customer sends money to an external bank account, ZWallet uses its settlement account as the underlying debtor account.

```text
ZWallet Customer
       │
       │ Transfer Request
       ▼
┌──────────────────┐
│ ZWallet Settlement│
│   Bank Account   │
└────────┬─────────┘
         │
         │ PIS
         ▼
┌──────────────────┐
│ Recipient Bank   │
│      IBAN        │
└──────────────────┘
```

The customer's identity is attributed through the payment's `remittanceInformation`, even though the actual bank account used for settlement belongs to the application.

---

### 🔄 Internal Transfers

Transfers between two ZWallet users are handled entirely through the internal ledger.

**No external PIS transaction is required.**

```text
User A Wallet
     │
     │ Internal Transfer
     ▼
User B Wallet
```

This makes internal transfers faster and avoids unnecessary external banking operations.

---

# 🔄 Core Workflow

```text
┌─────────────────────┐
│    Create Account   │
│      / Login        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Link Bank        │
│      Account        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      Top-Up         │
│  Bank → Settlement  │
│  Account → Wallet   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Choose Recipient  │
│   & Transfer Type   │
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
      ┌────┴────┐
      │ Transfer │
      │ Confirmed│
      └────┬────┘
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
                    │    TypeScript      │
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
                                      │ Bank APIs   │
                                      │ Accounts    │
                                      │ CAF         │
                                      │ PIS         │
                                      └─────────────┘
```

---

# 🧩 Transfer Types

| Transfer Type        | External API | Settlement Account | Ledger |
| -------------------- | -----------: | -----------------: | -----: |
| 🏠 Internal Transfer |            ❌ |                  ❌ |      ✅ |
| 💰 Customer Top-Up   |        ✅ PIS |                  ✅ |      ✅ |
| 💸 External Transfer |        ✅ PIS |                  ✅ |      ✅ |

---

# 🏦 Admin / Settlement Account

ZWallet uses a dedicated **ADMIN** user to represent the application's pooled settlement account.

Every user has a role:

```text
ADMIN
CUSTOMER
```

Exactly one `ADMIN` account is expected to represent the application's settlement bank account.

The admin setup can be initialized with:

```bash
npm run seed:admin
```

The command is **idempotent** and can safely be executed again.

The settlement IBAN is configured through:

```env
ADMIN_SETTLEMENT_IBAN=
```

---

# 🛠️ Tech Stack

### 🎨 Frontend

<p>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white" />
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
* CAF
* Balances API
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

## 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Configure your PostgreSQL connection:

```env
DATABASE_URL="postgresql://..."
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

## 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

If required, configure:

```env
VITE_API_BASE_URL=
```

---

# ⚠️ Known JoPACC Sandbox Behavior

The project documents several behaviors discovered while integrating with the JoPACC sandbox.

### 🔹 PIS Debtor Information

The sandbox expects **creditor-side information only** for PIS requests.

Debtor information such as:

```text
dbtr
dbtrAcct
dbtrAgt
```

must not be included in the PIS payload.

The debtor is treated as implicit by the sandbox.

---

### 🔹 Account Lock Flags

The sandbox's:

```text
lockedForDebit
lockedForCredit
```

flags do not prevent PIS transactions in the tested scenarios.

They mainly affect account and CAF lookups.

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

JoPACC requests require a common set of identification headers:

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

# 🎯 Project Goals

### 🛡️ Safer Transfers

Reduce accidental transfers by making recipient identity highly visible and adding voice confirmation.

### 🏦 Realistic Fintech Architecture

Model real-world banking flows instead of treating the wallet as a simple database balance.

### 🔗 Open Banking Integration

Connect the application to banking infrastructure through standardized Open Banking APIs.

### ⚡ Reliable Transactions

Ensure wallet balances are updated only after successful payment processing.

### 🧩 Clear Separation

Separate internal wallet transactions from external banking transactions.

---

# 🚀 Future Improvements

Potential future enhancements:

* 📱 React Native mobile application
* 🔔 Real-time transaction notifications
* 🔐 Biometric confirmation
* 📊 Advanced transaction analytics
* 💳 Virtual cards
* 🧾 Digital transaction receipts
* 🔄 Transaction retry & reconciliation mechanisms
* 🏦 Support for additional banking providers
* 📈 Admin financial dashboard
* 🔍 Advanced fraud detection
* 🛡️ Transaction limits and risk controls
* 📜 Complete audit logging

---

# 💡 The Core Idea

Traditional transfers often rely on the sender correctly entering an account number.

**ZWallet adds another question before money moves:**

> **"Is this really the person you intended to send money to?"**

By combining **recipient identity confirmation, voice verification, internal wallet transfers, and Open Banking infrastructure**, ZWallet aims to make digital transfers safer and more transparent.

---

<div align="center">

### 💳 Verify. Confirm. Transfer. Safely.

**ZWallet — Making person-to-person payments safer.**

</div>
