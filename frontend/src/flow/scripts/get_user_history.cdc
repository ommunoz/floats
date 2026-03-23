import FloatsTabManager from 0xFLOATS_TAB_MANAGER

access(all) struct UserHistoryFeedItem {
    access(all) let id: String
    access(all) let tabID: String
    access(all) let type: String
    access(all) let amount: UFix64
    access(all) let timestamp: UFix64

    init(id: String, tabID: String, type: String, amount: UFix64, timestamp: UFix64) {
        self.id = id
        self.tabID = tabID
        self.type = type
        self.amount = amount
        self.timestamp = timestamp
    }
}

access(all) fun main(userAddress: Address): [UserHistoryFeedItem] {
    var feed: [UserHistoryFeedItem] = []
    let allTabs = FloatsTabManager.tabs.values
    var counter = 0

    for tab in allTabs {
        for event in tab.history {
            if event.userAddress == userAddress {
                let id = tab.id.concat("-").concat(counter.toString())
                feed.append(
                    UserHistoryFeedItem(
                        id: id,
                        tabID: tab.id,
                        type: event.type,
                        amount: event.amount,
                        timestamp: event.timestamp
                    )
                )
                counter = counter + 1
            }
        }
    }

    // Sort the feed array by timestamp descending (newest first)
    // using a simple insertion sort since array size will be small for demo
    var i = 1
    while i < feed.length {
        var j = i
        while j > 0 && feed[j-1].timestamp < feed[j].timestamp {
            // swap
            let temp = feed[j]
            feed[j] = feed[j-1]
            feed[j-1] = temp
            j = j - 1
        }
        i = i + 1
    }

    return feed
}
