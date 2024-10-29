import axios from 'axios'
import { compact } from 'lodash'
import { timeout } from 'puppeteer'
import { ProxyProfile } from '~/@types/data'
import { log } from '~/lib/utils'

export const proxies = []
export const proxiesOther = []

export const parseProxyProfile = (prx: string): ProxyProfile => {
  const splitPrx = prx?.split(':') as string[]
  const [host, port, username, password] = splitPrx

  return {
    host,
    port: +port,
    mode: 'http',
    username,
    password,
    torProxyRegion: '',
    autoProxyRegion: ''
  }
}

export const proxy = async (prx: string) => {
  try {
    const proxyRegex = /^(?<host>\d+\.\d+\.\d+\.\d+):(?<port>\d+):(?<username>[^:]+):(?<password>[^:]+)$/
    if (proxyRegex.test(prx)) {
      const proxy = parseProxyProfile(prx)
      const _isProxyActive = await isProxyActive(proxy)

      if (!_isProxyActive) {
        return undefined
      }
      return proxy
    }
  } catch (error) {
    log((error as any)?.message)
    return undefined
  }
}
export interface Proxy {
  host: string
  port: string
  proxyUsername: string
  proxyPassword: string
}
export const isProxyActive = async (proxy: ProxyProfile) => {
  try {
    if (!proxy) return false

    const res = await axios.post<
      [
        {
          proxy: string
          ip: string
          type: string
          status: 'Live' | 'Die'
        }
      ]
    >(
      'https://checkproxy.vip/check_proxy.php',
      {
        proxies: [`${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`],
        format: 'host:port:username:password',
        type: 'http'
      },
      {
        timeout: 10000
      }
    )
    // log('IP: ', res.data)
    return res.data[0].status === 'Live'
  } catch (error: any) {
    //log('Check proxy: ', error?.message)
    return false
  }
}

export const filterActiveProxies = async (proxies: string[]) => {
  const activeProxies = compact(await Promise.all(proxies.map((prx) => proxy(prx))))
  log(`Active Proxies (${activeProxies.length})`)
  log(`Inactive Proxies (${proxies.length - activeProxies.length})`)
  return activeProxies
}
