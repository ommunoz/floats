import "FloatsTabManager"

access(all) fun main(merchantID: String): UFix64 {
    // Assuming the public function getBalance is on the contract itself if it's singleton-like,
    // or we need to borrow it from the admin. The product ref says "TabPool Contract: 
    // The single on-chain contract that manages all Tab state."
    
    // In our implementation, we placed the dictionary inside a resource TabLedger, 
    // which means we have to borrow it from an address, but the plan also implies
    // it's a single contract holding all merchant balances. 

    // Let's modify the contract to hold the dictionaries at the contract level for MVP simplicity
    // rather than inside a resource, as it strictly matches the "single on-chain contract" description.
    
    // For now, this script will call a contract-level method (which we will update the contract to have).
    return FloatsTabManager.getBalance(merchantID: merchantID)
}
