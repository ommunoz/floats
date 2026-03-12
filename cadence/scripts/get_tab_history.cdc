import "FloatsTabManager"

access(all) fun main(merchantID: String): [FloatsTabManager.HistoryEvent] {
    let result: [FloatsTabManager.HistoryEvent] = []
    if let history = FloatsTabManager.tabHistory[merchantID] {
        for record in history {
            // Manually reconstruct to ensure a value copy is returned
            result.append(FloatsTabManager.HistoryEvent(
                type: record.type,
                userAddress: record.userAddress,
                amount: record.amount,
                timestamp: record.timestamp
            ))
        }
    }
    return result
}
