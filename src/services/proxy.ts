import axios from 'axios'
import fs from 'fs'
import { compact } from 'lodash'
import { log } from '~/lib/utils'

export interface Proxy {
  host: string
  port: string
  username: string
  password: string
}
export const isProxyActive = async (host: string, port: string, username: string, password: string) => {
  try {
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
        proxies: [`${host}:${port}:${username}:${password}`],
        format: 'host:port:username:password',
        type: 'http'
      },
      {
        timeout: 10000
      }
    )
    return { host, port, username, password, status: 'success', response: res.data }
  } catch (error: any) {
    return { host, port, username, password, status: 'fail', error: error.message }
  }
}
export async function checkProxiesFromFile(filePath: string): Promise<Proxy[]> {
  try {
    const pLimit = (await import('p-limit')).default
    const data = await fs.promises.readFile(filePath, 'utf8')
    const lines = data.split('\n').filter((line) => line.trim() !== '')
    const limit = pLimit(300) // Giới hạn số request chạy song song
    let nonWorkingProxies = 0
    // Duyệt qua từng dòng proxy trong file
    const results = await Promise.all(
      lines.map((line, index) => {
        const proxyRegex = /^(?<host>[^:]+):(?<port>\d+):(?<username>[^:]+):(?<password>[^:]+)$/
        const match = line.match(proxyRegex)

        if (match && match.groups) {
          const { host, port, username, password } = match.groups
          return limit(async () => {
            const result = await isProxyActive(host, port, username, password)
            if (result.status === 'success') {
              return { host, port, username, password }
            } else {
              nonWorkingProxies++
              return null // Để null nếu proxy không hoạt động
            }
          })
        } else {
          console.log(`Invalid proxy format: ${line}`)
          return null // Để null nếu định dạng không hợp lệ
        }
      })
    )

    // Đợi tất cả proxy được kiểm tra
    const validProxies = results.filter((proxy): proxy is Proxy => proxy !== null)
    console.log(`working proxies: (${validProxies.length})`)
    console.log(`non-working proxies: (${nonWorkingProxies})`)
    return validProxies
  } catch (error) {
    console.error('Error reading file or checking proxies:', error)
    return []
  }
}

// export const saveActiveProxiesToFile = async (filePath: string, outputFilePath: string) => {
//   try {
//     // Read proxies from the file and split by line
//     const fileContent = fs.readFileSync(filePath, 'utf-8')
//     const proxies = fileContent.trim().split('\n')

//     const activeProxies = compact(await Promise.all(proxies.map((prx: string) => proxy(prx))))

//     // Log the counts of active and inactive proxies
//     log(`Active Proxies (${activeProxies.length})`)
//     log(`Inactive Proxies (${proxies.length - activeProxies.length})`)

//     // Format the active proxies for saving
//     const dataToWrite = activeProxies
//       .map((proxy) => `${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`)
//       .join('\n')

//     fs.writeFileSync(outputFilePath, dataToWrite, 'utf-8')
//     log(`Successfully saved active proxies to ${outputFilePath}`)

//     return activeProxies
//   } catch (error) {
//     log(`Error saving active proxies: ${(error as any)?.message}`)
//     return []
//   }
// }
