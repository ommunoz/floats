import tabsData from '../data/tabs.json'

export function getMerchantName(tabID: string) {
  const t = tabsData.find((t: any) => t.id === tabID)
  return t ? t.merchantName : tabID
}

export function timeAgo(ts: string) {
  const date = new Date(parseFloat(ts) * 1000)
  if (isNaN(date.getTime())) return 'Just now'
  
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " years ago"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " months ago"
  interval = seconds / 86400
  if (interval >= 2) return Math.floor(interval) + " days ago"
  if (interval >= 1) return "Yesterday"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " hours ago"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " minutes ago"
  return "Just now"
}
