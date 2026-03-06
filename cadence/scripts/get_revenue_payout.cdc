import "FloatsTabManager"

// This script verifies the physical fiat value (IOU) owed to the merchant 
// for Floats that have been officially consumed via the Stripe JIT Authorizer.
access(all) fun main(merchantID: String): UFix64 {
    return FloatsTabManager.getRevenuePayout(merchantID: merchantID)
}
