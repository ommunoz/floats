import FloatsTabManager from 0xFLOATS_TAB_MANAGER

// This script now acts purely as a UX lock checker for the Frontend.
// It bypasses the Smart Contract entirely and looks straight into the user's backpack.
access(all) fun main(claimerAddress: Address): {String: AnyStruct}? {
    
    let account = getAccount(claimerAddress)
    
    // Attempt to read the Physical Ticket using the Public Capability
    let receiptRef = account.capabilities.borrow<&FloatsTabManager.FloatReceipt>(/public/FloatReceiptPublic)
    
    if let ref = receiptRef {
        return {
            "tabID": ref.tabID,
            "amount": ref.amount,
            "expiresAt": ref.expiresAt
        }
    }
    
    return nil
}
