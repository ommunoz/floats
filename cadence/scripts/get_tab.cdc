import "FloatsTabManager"

access(all) fun main(tabID: String): &FloatsTabManager.Tab? {
    return FloatsTabManager.tabs[tabID]
}
