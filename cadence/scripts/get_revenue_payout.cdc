import FloatsTabManager from 0xFLOATS_TAB_MANAGER

// This script verifies the physical fiat value (IOU) owed to the merchant 
// for Floats that have been officially consumed via the Stripe JIT Authorizer.
access(all) fun main(tabID: String): UFix64 {
    if let tab = FloatsTabManager.tabs[tabID] {
        return tab.pendingRevenuePayouts
    }
    return 0.0
}
