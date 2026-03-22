import * as fcl from '@onflow/fcl'
import getBlockTimestampScript from '../flow/scripts/get_current_timestamp.cdc?raw'

/**
 * Returns the current block timestamp from the Flow network.
 * Use this to calibrate local clock against on-chain time —
 * not a float-specific concern.
 */
export async function fetchBlockTimestamp(): Promise<number> {
  const result = await fcl.query({ cadence: getBlockTimestampScript })
  return parseFloat(result ?? '0')
}
