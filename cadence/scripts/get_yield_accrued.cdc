import FloatsTabManager from 0xFLOATS_TAB_MANAGER

// This script verifies the physical DeFi yield earned by the merchant 
// on the idle capital sitting in the Protocol Treasury.
access(all) fun main(tabID: String): UFix64 {
    if let tab = FloatsTabManager.tabs[tabID] {
        return tab.yieldAccrued
    }
    return 0.0
}
