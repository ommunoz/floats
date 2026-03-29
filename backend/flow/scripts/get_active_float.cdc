import FloatsTabManager from 0xFLOATS_TAB_MANAGER

access(all) fun main(address: Address): {String: AnyStruct}? {
    let account = getAccount(address)
    
    // Attempt to read the Physical Ticket using the Public Capability
    let receiptRef = account.capabilities.borrow<&FloatsTabManager.FloatReceipt>(/public/FloatReceiptPublic)
    
    if let ref = receiptRef {
        // Only return if it's NOT expired
        if ref.expiresAt >= getCurrentBlock().timestamp {
            return {
                "tabID": ref.tabID,
                "amount": ref.amount,
                "expiresAt": ref.expiresAt
            }
        }
    }
    
    return nil
}
