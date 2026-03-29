import FloatsTabManager from 0xFLOATS_TAB_MANAGER

pub fun main(address: Address): {String: AnyStruct}? {
    let account = getAccount(address)
    
    let activeFloat = account.getCapability(/public/FloatReceiptPublic)
        .borrow<&{FloatsTabManager.ReceiptPublic}>()
        ?? return nil

    if (activeFloat.expiresAt < getCurrentBlock().timestamp) {
        return nil
    }

    return {
        "amount": activeFloat.amount,
        "expiresAt": activeFloat.expiresAt,
        "tabID": activeFloat.tabID
    }
}
