# 🛟 floats

**The Community Growth Engine for Local Business.**\
_Powered by Programmable Spend on Flow._

Floats turns community support into measurable, in-store foot traffic. Patrons
fund a tab at a local business — neighbors draw from it with a phone tap. No
wallet, no friction at checkout.

---

## The Problem

Global chains use massive budgets, proprietary apps, and automated rewards to
drive in-store traffic at scale.

Local businesses rely on authentic community connection, but lack the
infrastructure to convert that support into measurable foot traffic.

**Floats is that infrastructure.**

---

## How It Works

1. **A patron funds a tab** at their favorite local business using a standard
   credit card.
2. **A neighbor discovers the tab**, visits the location, and claims a Float — a
   spend credit up to a fixed amount.
3. **They tap to pay at the register** using their issued Floats virtual card.
4. **The merchant receives a standard card payment.** No new hardware, no app,
   no integration of any kind.

---

## The Float

The Float is a single-use, programmable spend authorization. It is implemented
as a Cadence resource, with its rules enforced at the protocol layer. When a
neighbor claims a Float, it is created for them. When they spend it, it is
consumed and destroyed. Authorization happens Just-In-Time at checkout.

**Protocol-Enforced Guarantees**

- **No double-spend** — a consumed Float is destroyed. It cannot be presented
  again because it no longer exists.
- **Merchant lock** — the Float is bound to a specific `merchantID` at creation.
  A mismatch at consumption reverts the transaction.
- **Expiry** — each Float carries a 15-minute TTL (`expiresAt` block timestamp).
  Expired Floats cannot be consumed; their value is returned to the tab.
- **Spend ceiling** — the Float's `maxAmount` caps the transaction. Any unused
  value is returned to the tab on consumption.

---

## Yield on Idle Capital

From the moment a patron funds a tab to the moment a Float is consumed, the
principal remains on-chain and accrues yield. That yield is reinvested directly
back into the tab balance, organically growing the pool over time.

---

## The Protocol Commitment

We absorb Stripe's processing fees on every patron deposit. Every dollar a
patron puts in hits the tab at full face value — a deliberate decision to
guarantee that community capital reaches the community intact.

---

## Tech Stack

| Layer           | Technology                                       |
| --------------- | ------------------------------------------------ |
| Smart Contracts | Cadence · Flow Testnet                           |
| Flow Client     | `@onflow/fcl`                                    |
| Frontend        | Vue 3 · Vite · Pinia                             |
| Backend         | Node.js · Express (`server.js`)                  |
| Yield           | `YieldVault.cdc` (mock, Increment Fi on mainnet) |
| Maps            | Leaflet.js                                       |
| Payments        | Stripe.js (sandbox mode)                         |

---

## Project Architecture

The Floats repository is cleanly separated into four distinct environments:

- `/cadence` — Contains the raw smart contracts, transactions, and scripts that
  power the protocol execution.
- `/frontend` — The Vue 3 application built for patrons and neighbors to
  interact with the chain.
- `/backend` — An Express Node.js application to process proxy authorizations
  and manage Stripe payment webhooks.
- `/seed` — A demonstration seeder pipeline that populates the testnet
  environment with simulated merchants and tabs.

---

## Demo Scope

| View                   | Route       | Description                                                      |
| ---------------------- | ----------- | ---------------------------------------------------------------- |
| **Discover**           | `/`         | Explore active tabs nearby.                                      |
| **Tab Details**        | `/tab/:id`  | View tab history, claim an available Float, or fund the pool.    |
| **User Profile**       | `/profile`  | View personal funding and float history.                         |
| **Merchant Dashboard** | `/merchant` | Live dashboard for merchants to monitor and configure their tab. |

## Deployed Contracts (Testnet)

| Contract           | Address              |
| ------------------ | -------------------- |
| `FloatsTabManager` | `0x5ad33e5de2af757d` |
| `YieldVault`       | `0x5ad33e5de2af757d` |

---

Floats · 2026
