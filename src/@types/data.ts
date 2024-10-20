export interface IProfile {
  name: string
  role: string
  id: string
  notes: string
  browserType: string
  lockEnabled: boolean
  timezone: {
    fillBasedOnIp: boolean
    timezone: ''
  }
  navigator: {
    userAgent: string
    resolution: string
    language: string
  }
  geolocation: {
    mode: string
    enabled: boolean
    customize: boolean
    fillBasedOnIp: boolean
    latitude: number
    longitude: number
    accuracy: number
  }
  canBeRunning: boolean
  os: string
  proxy: {
    mode: string
    port: number
    autoProxyRegion: string
    torProxyRegion: string
    host: string
    username: string
    password: string
  }
  proxyType: string
  proxyRegion: string
  sharedEmails: unknown[]
  shareId: string
  createdAt: string
  updatedAt: string
  lastActivity: string
  chromeExtensions: unknown[]
  userChromeExtensions: unknown[]
  tags: unknown[]
  proxyEnabled: boolean
}

export interface IProfiles {
  profiles: IProfile[]
  allProfilesCount: number
  currentOrbitaMajorV: number
  currentBrowserV: string
  currentTestBrowserV: string
  currentTestOrbitaMajorV: string
}

export interface APIResponse<T> {
  data: T
  meta: unknown
}

export interface FollowTask {
  offer_id: string
  provider: string
  title: string
  description: string
  short_description: string
  instructions: string
  image: string
  popularity: number
  payout_type: string
  payout: {
    amount: string
    currency: string
  }
  tags: string[]
}

export type FollowTaskAPIResponse = APIResponse<{
  offers: FollowTask[]
}>

export type Cookie = {
  url: string
  name: string
  value: string
  domain: string
  path: string
  session: boolean
  hostOnly: boolean
  secure: boolean
  httpOnly: boolean
  sameSite: string
  expirationDate: number
  creationDate: number
}

export type ProxyProfile = {
  autoProxyRegion: string
  host: string
  mode: string
  password: string
  port: number
  torProxyRegion: string
  username: string
}

export type ProxyProfileInfo = {
  id: string
  proxy: {
    mode: string
    host: string
    port: number
    username: string
    password: string
  }
  geolocation: {
    country: string
    region: string
    city: string
    timezone: string
  }
  status: string
  createdAt: string
  profilesCount: number
  foldersCount: number
  lastActivity: number
  profiles: never[]
}[]
