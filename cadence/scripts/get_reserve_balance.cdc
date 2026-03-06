import "FloatsTabManager"
import "FungibleToken"
import "FlowToken"

// This script verifies that the FloatsTabManager contract 
// physically holds the deposited Flow Tokens in its reserveVault.
access(all) fun main(): UFix64 {
    // We can read the balance directly from the public reserve vaults
    return FloatsTabManager.reserveVault.balance
}
