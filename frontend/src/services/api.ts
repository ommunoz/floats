/**
 * api.ts
 * Single source of truth for all backend HTTP calls.
 * Components and stores must never call fetch() directly.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as any).error || `Request failed: ${path}`)
  return data as T
}

// ---------------------------------------------------------------------------
// Payment / Funding
// ---------------------------------------------------------------------------

export interface CreatePaymentIntentPayload {
  amount: number       // in cents
  merchantID: string
  flowAddress: string
}

export interface CreatePaymentIntentResult {
  clientSecret: string
}

export function createPaymentIntent(payload: CreatePaymentIntentPayload): Promise<CreatePaymentIntentResult> {
  return request('/api/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface WaitForDepositPayload {
  paymentIntentId: string
}

export interface WaitForDepositResult {
  txId: string
}

export function waitForDeposit(payload: WaitForDepositPayload): Promise<WaitForDepositResult> {
  return request('/api/wait-for-deposit', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ---------------------------------------------------------------------------
// Float Lifecycle
// ---------------------------------------------------------------------------

export interface ClaimFloatPayload {
  tabId: string
  claimerAddress: string
  amount: number
}

export interface ClaimFloatResult {
  txId: string
}

export function claimFloat(payload: ClaimFloatPayload): Promise<ClaimFloatResult> {
  return request('/api/claim', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface DiscardFloatPayload {
  tabId: string
  claimerAddress: string
}

export interface DiscardFloatResult {
  txId: string
}

export function discardFloat(payload: DiscardFloatPayload): Promise<DiscardFloatResult> {
  return request('/api/discard', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ---------------------------------------------------------------------------
// Demo / Dev
// ---------------------------------------------------------------------------

export interface SimulateTapPayload {
  merchantID: string
  flowAddress: string
  amount: number
}

export interface SimulateTapResult {
  txId: string
}

export function simulateTap(payload: SimulateTapPayload): Promise<SimulateTapResult> {
  return request('/api/simulate-tap', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
