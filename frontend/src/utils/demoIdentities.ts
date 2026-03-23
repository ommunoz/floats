interface UserIdentity {
  name: string
  isDemoUser: boolean
  gender?: string
}

let users: Record<string, UserIdentity> = {}

export function setUsersData(data: Record<string, UserIdentity>) {
  users = data
}

export function getDisplayName(address: string): string {
  const normalized = address.startsWith('0x') ? address : `0x${address}`
  return users[normalized]?.name || 'Neighbor'
}

export function getAvatarUrl(addressOrSeed: string): string {
  const normalized = addressOrSeed.startsWith('0x') ? addressOrSeed : `0x${addressOrSeed}`
  const user = users[normalized]
  const gender = user?.gender || 'other'
  const seedForUrl = user?.name || addressOrSeed

  const bgColorsArray = ['d0c3f1', 'e9f9e5', 'ceeef8', 'ffd7ee', 'fef1ab', 'ffadad', 'ffd6a5']
  
  // Deterministically select a color based on the seed
  let hash = 0
  for (let i = 0; i < seedForUrl.length; i++) {
    hash = seedForUrl.charCodeAt(i) + ((hash << 7) - hash)
  }
  const pickedBgColor = bgColorsArray[Math.abs(hash) % bgColorsArray.length]

  const mouth = 'smile,default,serious,twinkle,concerned,disbelief,grimace,sad'
  const eyes = 'default,happy,hearts,side,squint,surprised,wink,winkWacky,eyeRoll'
  const femaleTops = 'bob,bun,curly,curvy,dreads,frida,fro,longButNotTooLong,miaWallace,straight01,straight02,bigHair,hijab,turban'
  const maleTops = 'shavedSides,dreads01,dreads02,frizzle,shaggy,shaggyMullet,shortCurly,shortFlat,shortRound,shortWaved,sides,theCaesar,theCaesarAndSidePart,turban'
  // DiceBear v9 requires hex codes for hairColor
  const naturalHair = '2c1b18,4a3123,72412b,a55828,e8b15d,f5d889'

  let params = `seed=${encodeURIComponent(seedForUrl)}&mouth=${mouth}&eyes=${eyes}&hairColor=${naturalHair}`


  if (gender === 'female') {
    params += `&top=${femaleTops}&facialHairProbability=0`
  } else if (gender === 'male') {
    params += `&top=${maleTops}`
  }

  return `https://api.dicebear.com/9.x/avataaars/svg?${params}&backgroundColor=${pickedBgColor}`
}

