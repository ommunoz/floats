import FloatsTabManager from 0xFLOATS_TAB_MANAGER

access(all) fun main(tabID: String): &FloatsTabManager.Tab? {
    return FloatsTabManager.tabs[tabID]
}
