import * as fcl from '@onflow/fcl'
import getActiveFloatScript from '../flow/scripts/get_active_float.cdc?raw'

// Shared with tabs.ts for the activeFloats registry shape — kept minimal
export interface FloatReceipt {
  amount: number
  expiresAt: number
}

const BACKEND_URL = 'http://localhost:3001'

// ---------------------------------------------------------------------------
// Chain reads — user account scope
// ---------------------------------------------------------------------------

/**
 * Reads the FloatReceipt resource from the user's account backpack.
 * This is a user-scoped query: it looks at /public/FloatReceiptPublic
 * on the claimer's account, not at any tab data.
 */
export async function fetchFloatReceipt(claimerAddress: string): Promise<FloatReceipt | null> {
  const result = await fcl.query({
    cadence: getActiveFloatScript,
    args: (arg: any, t: any) => [arg(claimerAddress, t.Address)],
  })

  if (!result) return null

  return {
    amount: parseFloat(result.amount),
    expiresAt: parseFloat(result.expiresAt),
  }
}
// ---------------------------------------------------------------------------
// Backend API calls — float lifecycle actions
// ---------------------------------------------------------------------------

export interface ClaimResult {
  txId: string
}

export interface DiscardResult {
  txId: string
}

/**
 * Submits a claim transaction via the backend managed-key proxy.
 * The backend signs on behalf of the claimer and returns the sealed txId.
 */
export async function claimFloat(
  tabId: string,
  claimerAddress: string,
  amount: number
): Promise<ClaimResult> {
  const response = await fetch(`${BACKEND_URL}/api/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tabId, claimerAddress, amount }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to claim float')
  }

  return response.json()
}

/**
 * Submits a discard transaction via the backend managed-key proxy,
 * returning the float's locked funds back to the tab's idle pool.
 */
export async function discardFloat(
  tabId: string,
  claimerAddress: string
): Promise<DiscardResult> {
  const response = await fetch(`${BACKEND_URL}/api/discard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tabId, claimerAddress }),
  })

  if (!response.ok) {
    throw new Error('Failed to discard float on-chain')
  }

  return response.json()
}
