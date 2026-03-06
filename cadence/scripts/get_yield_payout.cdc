import "FloatsTabManager"

// This script verifies the physical DeFi yield earned by the merchant 
// on the idle capital sitting in the Protocol Treasury.
access(all) fun main(merchantID: String): UFix64 {
    return FloatsTabManager.getYieldPayout(merchantID: merchantID)
}
