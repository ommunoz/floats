import FloatsTabManager from 0xFLOATS_TAB_MANAGER

access(all) fun main(merchantID: String): {Address: FloatsTabManager.FunderStats} {
    let result: {Address: FloatsTabManager.FunderStats} = {}
    if let funders = FloatsTabManager.tabFunders[merchantID] {
        for key in funders.keys {
            if let stats = funders[key] {
                // Manually reconstruct to ensure a value copy is returned
                result[key] = FloatsTabManager.FunderStats(
                    totalFunded: stats.totalFunded
                )
            }
        }
    }
    return result
}

