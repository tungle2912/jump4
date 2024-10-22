import axios from 'axios'
import { compact } from 'lodash'
import { ProxyProfile } from '~/@types/data'
import { log } from '~/lib/utils'

export interface Proxy {
  host: string
  port: string
  proxyUsername: string
  proxyPassword: string
}

export const proxies = [
  '171.237.242.128:10018:ipv0710:ipvietstore',
  '103.209.34.222:30060:u19924c89:p59c86c4e',
  '113.179.41.35:45270:3053mdVDzNGU:1500prxvjp',
  '171.237.242.128:10027:ipv0710:ipvietstore',
  '171.237.242.128:10045:ipv0710:ipvietstore',
  '171.237.242.128:10005:ipv0710:ipvietstore',
  '103.209.34.222:30056:u19924c89:p59c86c4e',
  '171.241.58.83:50003:tondo:tondo',
  '171.241.58.83:50002:tondo:tondo',
  '171.241.58.83:50001:tondo:tondo',
  '171.241.58.83:50008:tondo:tondo',
  '171.237.242.128:10046:ipv0710:ipvietstore',
  '171.237.242.128:10049:ipv0710:ipvietstore',
  '116.110.97.135:45270:1827mdHFvQlB:BELAPV',
  '171.238.22.228:21433:1746mdTjDwrV:MxeQPj',
  '171.238.22.233:31423:1749mdzsVWMK:CXGdwo',
  '27.73.91.110:24253:1712mdHzVmRr:qFrEeR',
  '171.238.23.0:27434:1785mdaEVQle:MymTGM',
  '171.224.206.198:24253:494mdvt02:vt02',
  '116.96.52.96:35270:303mdvt02:vt02',
  '171.238.22.240:23270:1776mdaEVQle:MymTGM',
  '103.209.34.222:30048:u19924c89:p59c86c4e',
  '103.209.34.222:30051:u19924c89:p59c86c4e',
  '171.238.20.28:16584:quocdung:truong',
  '116.110.99.179:37432:21mdhung:hung',
  '116.98.45.180:45270:45mdgRpOyL:NXcKoH',
  '171.238.21.234:21446:random:random',
  '103.209.34.222:30024:u19924c89:p59c86c4e',
  '27.73.91.161:21433:475mdvt02:vt02',
  '116.107.70.181:16584:quocdung:truong',
  '116.97.15.128:45270:1908mdwsfDWK:zZUOQJ',
  '171.237.242.128:10043:ipv0710:ipvietstore',
  '103.209.34.222:30025:u19924c89:p59c86c4e',
  '171.238.20.26:16584:quocdung:truong',
  '171.237.242.128:10020:ipv0710:ipvietstore',
  '116.98.45.203:45270:43mdgRpOyL:NXcKoH',
  '171.238.20.96:16584:quocdung:truong',
  '171.224.25.50:50001:tondo:tondo',
  '171.237.242.128:10013:ipv0710:ipvietstore',
  '27.73.91.154:33253:1679mdTwwJyU:xGhslK',
  '116.97.14.179:45270:1927mdHAtJOm:MLOceW',
  '171.238.20.101:16584:quocdung:truong',
  '171.238.23.44:23270:1799mdVuhQlG:OsOLZi',
  '116.96.51.228:35423:random:random',
  '171.237.242.128:10042:ipv0710:ipvietstore',
  '171.238.23.57:31423:1789mdaEVQle:MymTGM',
  '171.241.58.83:50007:tondo:tondo',
  '116.96.54.149:24253:304mdvt02:vt02',
  '103.209.34.222:30033:u19924c89:p59c86c4e',
  '171.237.242.128:10050:ipv0710:ipvietstore',
  '116.96.62.225:45270:1892mdhonXwr:oxmxgF',
  '171.237.242.128:10015:ipv0710:ipvietstore',
  '116.110.97.127:45270:1835mdtdcAIn:kTnVyr',
  '171.242.51.157:36254:1762mdaEVQle:MymTGM',
  '171.238.22.4:21446:random:random',
  '116.110.96.131:45270:1858mdOWunpj:xBZvuz',
  '171.242.51.5:24253:1671mdHpuQNq:oGRFpb',
  '171.238.21.238:21446:random:random',
  '27.73.91.158:21433:447mdvt02:vt02',
  '171.238.20.59:16584:quocdung:truong',
  '117.1.129.84:50001:tondo:tondo',
  '116.98.45.219:21433:1731mdLCUTdN:lgEASf',
  '103.209.34.222:30058:u19924c89:p59c86c4e',
  '171.236.42.32:33253:483mdvt02:vt02',
  '103.209.34.222:30006:u19924c89:p59c86c4e',
  '171.237.242.128:10004:ipv0710:ipvietstore',
  '27.76.107.119:10043:modemobc1:opcproxymang1',
  '116.97.15.44:45270:1878mdaVREnv:FtqyGx',
  '116.96.57.53:31423:14mdtyXxHP:vEwpfC',
  '116.110.96.83:45270:1846mdFIcLUe:NvXYBN',
  '116.97.14.230:45270:1855mdqRQycV:lHbXlL',
  '171.237.242.128:10007:ipv0710:ipvietstore',
  '116.97.14.123:33253:4525mdtranhao:tranhao1',
  '171.237.242.128:10026:ipv0710:ipvietstore',
  '171.237.242.128:10033:ipv0710:ipvietstore',
  '171.237.242.128:10041:ipv0710:ipvietstore',
  '171.237.242.128:10017:ipv0710:ipvietstore',
  '171.237.242.128:10022:ipv0710:ipvietstore',
  '116.97.14.120:45270:1929mdxEFNgZ:JIMkHX',
  '103.209.34.222:30003:u19924c89:p59c86c4e',
  '116.107.70.64:21446:random:random',
  '171.236.175.70:23270:434mdvt02:vt02',
  '103.209.34.222:30010:u19924c89:p59c86c4e',
  '103.209.34.222:30022:u19924c89:p59c86c4e',
  '103.209.34.222:30099:u19924c89:p59c86c4e',
  '171.242.50.130:45270:1823mdORLmTj:hxYeOF',
  '103.209.34.222:30007:u19924c89:p59c86c4e',
  '171.238.21.221:21446:random:random',
  '103.209.34.222:30098:u19924c89:p59c86c4e',
  '103.209.34.222:30063:u19924c89:p59c86c4e',
  '103.209.34.222:30064:u19924c89:p59c86c4e',
  '116.96.53.240:37432:1790mdaEVQle:MymTGM',
  '171.236.182.58:31423:91mdvt01:vt01',
  '116.98.46.0:37432:1772mdaEVQle:MymTGM',
  '103.209.34.222:30004:u19924c89:p59c86c4e',
  '103.209.34.222:30090:u19924c89:p59c86c4e',
  '103.209.34.222:30020:u19924c89:p59c86c4e',
  '116.98.47.130:31423:262mdvt02:vt02',
  '103.209.34.222:30084:u19924c89:p59c86c4e',
  '113.176.47.170:45270:3071mdXudtBs:1500prxvjp',
  '103.209.34.222:30012:u19924c89:p59c86c4e',
  '171.241.58.83:50005:tondo:tondo',
  '116.110.97.131:45270:1833mdtVJJzf:evMmMo',
  '103.209.34.222:30075:u19924c89:p59c86c4e',
  '103.209.34.222:30045:u19924c89:p59c86c4e',
  '171.238.20.31:16584:quocdung:truong',
  '171.238.21.189:21446:random:random',
  '171.237.242.128:10030:ipv0710:ipvietstore',
  '103.209.34.222:30042:u19924c89:p59c86c4e',
  '103.209.34.222:30041:u19924c89:p59c86c4e',
  '171.238.20.47:16584:quocdung:truong',
  '171.241.58.83:50006:tondo:tondo',
  '103.209.34.222:30069:u19924c89:p59c86c4e',
  '171.236.179.10:24253:420mdvt02:vt02',
  '171.242.50.222:24253:458mdvt02:vt02',
  '171.241.58.83:50004:tondo:tondo',
  '171.224.25.50:50003:tondo:tondo',
  '171.237.242.128:10021:ipv0710:ipvietstore',
  '103.209.34.222:30011:u19924c89:p59c86c4e',
  '171.224.207.126:33253:350mdvt02:vt02',
  '27.73.91.96:37432:1704mdZXOJxX:zuvMvF',
  '103.209.34.222:30081:u19924c89:p59c86c4e',
  '27.73.91.126:21433:1747mdyMESoj:yEStNN',
  '171.236.168.135:35270:1810mdgpJAJx:RDXQSs',
  '116.110.96.100:45270:1854mdVAcjZO:CexQHc',
  '27.76.107.119:10044:modemobc1:opcproxymang1',
  '171.242.50.142:35270:223mdvt02:vt02',
  '27.73.91.17:31324:4523mdtranhao:tranhao1',
  '171.241.58.83:50009:tondo:tondo',
  '103.209.34.222:30094:u19924c89:p59c86c4e',
  '171.242.50.174:21433:445mdvt02:vt02',
  '103.209.34.222:30072:u19924c89:p59c86c4e',
  '103.209.34.222:30089:u19924c89:p59c86c4e',
  '103.209.34.222:30009:u19924c89:p59c86c4e',
  '27.73.90.239:21433:240mdvt02:vt02',
  '103.209.34.222:30080:u19924c89:p59c86c4e',
  '14.178.173.212:37434:2963mdZFjLJK:1500prxvjp',
  '103.209.34.222:30055:u19924c89:p59c86c4e',
  '103.209.34.222:30046:u19924c89:p59c86c4e',
  '116.97.15.61:35270:3176mdLonghung:Longhung01',
  '116.96.57.27:35270:306mdvt02:vt02',
  '103.209.34.222:30070:u19924c89:p59c86c4e',
  '171.236.170.67:23270:344mdvt02:vt02',
  '103.209.34.222:30015:u19924c89:p59c86c4e',
  '171.238.20.61:16584:quocdung:truong',
  '103.209.34.222:30016:u19924c89:p59c86c4e',
  '103.209.34.222:30019:u19924c89:p59c86c4e',
  '103.209.34.222:30039:u19924c89:p59c86c4e',
  '103.209.34.222:30023:u19924c89:p59c86c4e',
  '171.238.20.54:16584:quocdung:truong',
  '103.209.34.222:30095:u19924c89:p59c86c4e',
  '171.237.242.128:10010:ipv0710:ipvietstore',
  '171.236.188.159:31423:305mdvt02:vt02',
  '103.209.34.222:30037:u19924c89:p59c86c4e',
  '103.209.34.222:30040:u19924c89:p59c86c4e',
  '103.209.34.222:30053:u19924c89:p59c86c4e',
  '14.235.67.137:37434:3002mdWSmJjp:1500prxvjp',
  '103.209.34.222:30093:u19924c89:p59c86c4e',
  '171.237.242.128:10044:ipv0710:ipvietstore',
  '103.209.34.222:30096:u19924c89:p59c86c4e',
  '14.235.67.141:37434:3004mdTaAcYh:1500prxvjp',
  '103.209.34.222:30088:u19924c89:p59c86c4e',
  '103.209.34.222:30027:u19924c89:p59c86c4e',
  '116.98.45.241:33253:1741mdPOJrec:rcdITS',
  '14.235.67.147:37434:2988mdsIBKgr:1500prxvjp',
  '103.209.34.222:30077:u19924c89:p59c86c4e',
  '103.209.34.222:30054:u19924c89:p59c86c4e',
  '103.209.34.222:30021:u19924c89:p59c86c4e',
  '171.236.175.48:31423:1804mdwfyMJS:blrSjd',
  '171.238.21.222:21446:random:random',
  '103.209.34.222:30057:u19924c89:p59c86c4e',
  '113.176.47.98:45270:3049mdrfPEkp:1500prxvjp',
  '103.209.34.222:30002:u19924c89:p59c86c4e',
  '171.242.50.41:33253:243mdvt02:vt02',
  '103.209.34.222:30008:u19924c89:p59c86c4e',
  '171.236.165.77:37432:363mdvt02:vt02',
  '103.209.34.222:30071:u19924c89:p59c86c4e',
  '171.224.206.90:33253:342mdvt02:vt02',
  '171.242.51.6:33253:1707mdrIKtzQ:TFnFcl',
  '171.237.242.128:10025:ipv0710:ipvietstore',
  '171.237.242.128:10048:ipv0710:ipvietstore',
  '171.237.242.128:10002:ipv0710:ipvietstore',
  '171.237.242.128:10029:ipv0710:ipvietstore',
  '171.238.22.13:21446:random:random',
  '116.97.15.165:45270:1901mdFfDDHh:zFvuyV',
  '103.209.34.222:30074:u19924c89:p59c86c4e',
  '103.209.34.222:30005:u19924c89:p59c86c4e',
  '116.98.45.84:27434:491mdvt02:vt02',
  '103.209.34.222:30017:u19924c89:p59c86c4e',
  '103.209.34.222:30014:u19924c89:p59c86c4e',
  '116.98.46.11:27434:3196mdLonghung:Longhung01',
  '103.209.34.222:30092:u19924c89:p59c86c4e',
  '14.235.67.168:37434:3015mdlEuTBi:1500prxvjp',
  '103.209.34.222:30076:u19924c89:p59c86c4e',
  '171.224.202.228:24253:236mdvt02:vt02',
  '116.98.47.141:24253:254mdvt02:vt02',
  '103.209.34.222:30061:u19924c89:p59c86c4e',
  '103.209.34.222:30065:u19924c89:p59c86c4e',
  '171.242.50.208:36254:1765mdaEVQle:MymTGM',
  '27.76.107.119:10041:modemobc1:opcproxymang1'
]
export const proxiesOther = [
  '103.209.34.222:30044:u19924c89:p59c86c4e',
  '14.178.16.36:45270:3064mdsocmmq:1500prxvjp',
  '116.97.14.139:35270:1773mdaEVQle:MymTGM',
  '116.97.15.80:37432:1770mdaEVQle:MymTGM',
  '103.209.34.222:30049:u19924c89:p59c86c4e',
  '171.237.242.128:10003:ipv0710:ipvietstore',
  '103.209.34.222:30013:u19924c89:p59c86c4e',
  '171.224.207.62:35270:389mdvt02:vt02',
  '116.98.45.146:37432:476mdvt02:vt02',
  '103.209.34.222:30050:u19924c89:p59c86c4e',
  '116.110.97.133:45270:1836mdyBGVWy:fZzrUW',
  '116.98.45.149:36254:1685mduualrk:wbWBse',
  '116.98.46.26:21433:1737mdhXqxdD:BoJWau',
  '171.224.25.50:50002:tondo:tondo',
  '171.237.242.128:10012:ipv0710:ipvietstore',
  '103.209.34.222:30038:u19924c89:p59c86c4e',
  '103.209.34.222:30001:u19924c89:p59c86c4e',
  '171.238.21.188:21446:random:random',
  '103.209.34.222:30026:u19924c89:p59c86c4e',
  '116.97.15.84:45270:1894mdgFJdfO:FmVLMV',
  '171.238.20.24:16584:quocdung:truong',
  '171.237.242.128:10011:ipv0710:ipvietstore',
  '103.209.34.222:30091:u19924c89:p59c86c4e',
  '103.209.34.222:30030:u19924c89:p59c86c4e',
  '171.237.242.128:10047:ipv0710:ipvietstore',
  '171.238.22.231:21433:1753mdhIvbsF:fuLFbp',
  '103.209.34.222:30068:u19924c89:p59c86c4e',
  '171.237.242.128:10028:ipv0710:ipvietstore',
  '103.209.34.222:30043:u19924c89:p59c86c4e',
  '113.176.47.84:45270:3050mdRCRuBa:1500prxvjp',
  '103.209.34.222:30082:u19924c89:p59c86c4e',
  '171.238.21.219:21446:random:random',
  '171.238.21.213:21446:random:random',
  '14.235.67.122:37434:2970mdqlBFZR:1500prxvjp',
  '103.209.34.222:30087:u19924c89:p59c86c4e',
  '171.237.242.128:10014:ipv0710:ipvietstore',
  '27.73.91.224:37432:3174mdLonghung:Longhung01',
  '171.237.242.128:10009:ipv0710:ipvietstore',
  '103.209.34.222:30078:u19924c89:p59c86c4e',
  '171.238.21.184:21446:random:random',
  '103.209.34.222:30079:u19924c89:p59c86c4e',
  '103.209.34.222:30062:u19924c89:p59c86c4e',
  '116.110.99.118:45270:1848mdgxAdDH:WAWIhm',
  '116.98.45.103:24253:478mdvt02:vt02',
  '171.242.50.94:37432:3190mdLonghung:Longhung01',
  '171.238.20.100:16584:quocdung:truong',
  '171.242.50.91:21433:231mdvt02:vt02',
  '113.176.47.65:45270:3031mdnZpaGZ:1500prxvjp',
  '171.237.242.128:10023:ipv0710:ipvietstore',
  '103.209.34.222:30029:u19924c89:p59c86c4e',
  '171.238.20.72:16584:quocdung:truong',
  '171.237.242.128:10019:ipv0710:ipvietstore',
  '14.235.67.136:37434:2987mdJoICnu:1500prxvjp',
  '116.97.14.28:36254:1752mdrxKmwF:NraQyO',
  '171.237.242.128:10024:ipv0710:ipvietstore',
  '116.96.53.140:33253:12mdtyXxHP:vEwpfC',
  '103.209.34.222:30073:u19924c89:p59c86c4e',
  '171.237.242.128:10016:ipv0710:ipvietstore',
  '103.209.34.222:30047:u19924c89:p59c86c4e',
  '171.237.242.128:10008:ipv0710:ipvietstore',
  '103.209.34.222:30034:u19924c89:p59c86c4e',
  '171.224.200.220:36254:1667mdBuRxxL:tLOtgD',
  '103.209.34.222:30052:u19924c89:p59c86c4e',
  '171.237.242.128:10006:ipv0710:ipvietstore',
  '103.209.34.222:30018:u19924c89:p59c86c4e',
  '116.98.45.83:37432:453mdvt02:vt02',
  '171.238.20.71:16584:quocdung:truong',
  '103.209.34.222:30035:u19924c89:p59c86c4e',
  '103.209.34.222:30097:u19924c89:p59c86c4e',
  '171.236.160.31:21433:419mdvt02:vt02',
  '103.209.34.222:30028:u19924c89:p59c86c4e',
  '103.209.34.222:30067:u19924c89:p59c86c4e',
  '103.209.34.222:30036:u19924c89:p59c86c4e',
  '103.209.34.222:30031:u19924c89:p59c86c4e',
  '103.209.34.222:30032:u19924c89:p59c86c4e',
  '103.209.34.222:30059:u19924c89:p59c86c4e',
  '103.209.34.222:30086:u19924c89:p59c86c4e',
  '117.1.129.84:50003:tondo:tondo',
  '117.1.129.84:50006:tondo:tondo'
]

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

export const isProxyActive = async (proxy: ProxyProfile) => {
  try {
    if (!proxy) return false

    const res = await axios.get('http://api.myip.com', {
      proxy: {
        host: proxy.host,
        port: +proxy.port,
        auth: {
          username: proxy.username,
          password: proxy.password
        }
      },
      timeout: 5000
    })
    // log('IP: ', res.data)
    return true
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
