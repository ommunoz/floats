import * as fcl from '@onflow/fcl'
import getActiveFloatScript from '../flow/scripts/get_active_float.cdc?raw'
import * as api from './api'

// Shared with tabs.ts for the activeFloats registry shape — kept minimal
export interface FloatReceipt {
  amount: number
  expiresAt: number
}

// Re-export result types so callers don't need to import api.ts directly
export type { ClaimFloatResult as ClaimResult, DiscardFloatResult as DiscardResult } from './api'

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

/**
 * Submits a claim transaction via the backend managed-key proxy.
 * The backend signs on behalf of the claimer and returns the sealed txId.
 */
export function claimFloat(
  tabId: string,
  claimerAddress: string,
  amount: number
) {
  return api.claimFloat({ tabId, claimerAddress, amount })
}

/**
 * Submits a discard transaction via the backend managed-key proxy,
 * returning the float's locked funds back to the tab's idle pool.
 */
export function discardFloat(tabId: string, claimerAddress: string) {
  return api.discardFloat({ tabId, claimerAddress })
}
