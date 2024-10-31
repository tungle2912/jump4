import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { connect } from 'puppeteer'
import envVariables from '~/constants/env-variables'
import emulatorController from '~/controllers/emulator.controllers'
import { confirm, sleep } from '~/lib/utils'
import GoLogin from '~/services/gologin'

import { ProxyProfile } from '~/@types/data'
import {
  activeProxy,
  activeProxyOther,
  addFirstIdJump,
  addIdJump,
  appendToFile,
  claimRewardsHoneygain,
  confirmUserRegistration,
  confirmWithOTP,
  createRandomEmail,
  deleteAccountJumps,
  enterBonusCodeJumptask,
  followXJumptask,
  getAchievementIdsForJumpTask,
  getCodeEmail,
  getCoin,
  getIdJump,
  isProxyActive,
  loadProxiesFromFile,
  loginJumptask,
  loginMail,
  loginTwitterOnJumptask,
  readFromFile,
  registerHoneygain,
  unlockAchievementsHoneygain,
  verifyEmail,
  writeToFile
} from '~/utils/utlis'
import { addProxyToProfile, getProfles } from '../api/gologin'
import adb from '../services/appium-adb'
const profiles: any[] = []
let currentProfileIndex = 0
let currentProxyIndex = 0
const idMain = envVariables.JUMPTASK_ID
const postId: any[] = [
  'f1338fab-2c71-4cb1-ba62-3699a1b3a3e2',
  '15a3d33d-46da-4dab-b460-566214c0a2c1',
  'ac9f2a8e-40b8-4076-ad9b-b258eb939ec7',
  'cbbb609e-c07f-475e-b7ec-a8b7aa125858',
  '383eaec5-8695-49f7-88e3-85ed5e30b4c1',
  '0a61314d-b734-46f1-9813-2c7696c7bd92'
]
let isLoginHoneygainActive = false
let isAddIdJumpMainActive = false
let coin = 0
let isFirstLoginEmulator = true
let proxyList: ProxyProfile[] = []
let proxyOtherList: ProxyProfile[] = []
async function initializeProfiles() {
  const result = await getProfles()
  if (result.data.profiles.length === 0) {
    console.log('No profiles available')
    return
  }
  const sortedProfiles = result.data.profiles.sort((a: any, b: any) => b.name.localeCompare(a.name))
  profiles.push(...sortedProfiles)
}
async function runProfile(profileId: string, proxy: any, axiosInstance: any) {
  const { launch } = await GoLogin()
  let goLoginBrowser
  let browser
  try {
    try {
      const { browser } = await launch({
        profileId: profileId,
        headless: false
      })
      goLoginBrowser = browser
    } catch (launchError) {
      await addProxyToProfile({
        profileId: profileId,
        proxy: proxy
      })
      const { browser } = await launch({
        profileId: profileId,
        headless: false
      })
      goLoginBrowser = browser
    }
    browser = await connect({
      browserWSEndpoint: goLoginBrowser?.wsEndpoint(),
      defaultViewport: null,
      protocolTimeout: 120000
    })

    browser.on('targetcreated', async (target) => {})

    browser.on('disconnected', () => {
      // Lắng nghe ngắt kết nối trình duyệt
      console.log('Tắt trình duyệt!')
    })

    browser.on('targetdestroyed', (target) => {
      // Lắng nghe việc đóng trang
      if (target.type() === 'page') {
        console.log(`Đóng trang: ${target.url()}`)
      }
    })
    const pages = await browser.pages()
    const jumptask = pages[0]
    await jumptask.goto('https://app.jumptask.io/earn')
    await jumptask.bringToFront()
    const checkLogin = await loginJumptask(browser, jumptask)
    if (!checkLogin) {
      await browser.close()
      return
    }
    await sleep(5000)
    const check = await loginTwitterOnJumptask(browser, profileId, proxy)
    const accessTokenJump = await jumptask.evaluate(() => {
      return localStorage.getItem('JWT')
    })
    console.log('Access token JumpTask:', accessTokenJump)
    if (!accessTokenJump) {
      browser.close()
      return
    }
    const idJump = await getIdJump(accessTokenJump || '')
    console.log('idJump:', idJump)

    if (!check) {
      await browser.close()
      return
    }
    await enterBonusCodeJumptask(accessTokenJump as string)
    await sleep(5000)
    const emailData = await createRandomEmail()
    if (!emailData) {
      throw new Error('Failed to create random email')
    }
    const { email, password } = emailData
    const tokenMail = await loginMail(email, password)
    const accessTokenHoneygain = await registerHoneygain(email as string, axiosInstance)
    while (isLoginHoneygainActive) {
      await sleep(5000)
    }
    isLoginHoneygainActive = true
    await emulatorController.loginHoneygain({
      deviceId: await adb.getDeviceId(),
      email: email || '',
      isFirst: isFirstLoginEmulator
    })
    isFirstLoginEmulator = false
    await browser.close()
    isLoginHoneygainActive = false
    //  const accessTokenHoneygain = await fetchNewAccessToken(email as string, axiosInstance)
    if (accessTokenHoneygain) {
      await confirmUserRegistration(accessTokenHoneygain)
      const confirmEmailLink = await verifyEmail(tokenMail, accessTokenHoneygain)
      await sleep(2000)
      // if (confirmEmailLink) {
      //   const page = await browser.newPage()
      //   await page.goto(confirmEmailLink)
      // }
      await confirm(confirmEmailLink)
      await sleep(5000)
      if (idJump) {
        await addFirstIdJump(accessTokenHoneygain, idJump)
        const otp = await getCodeEmail(tokenMail, accessTokenHoneygain, idJump)
        if (otp) {
          await confirmWithOTP(accessTokenHoneygain, otp)
        }
        await sleep(2000)
        await addIdJump(accessTokenHoneygain, idJump)
      } else {
        console.error('idJump is undefined')
      }
      await sleep(2000)
      await unlockAchievementsHoneygain(accessTokenHoneygain, email)
      await sleep(2000)
      let countTask = 0
      for (const id of postId) {
        const isSuccessTask = await followXJumptask(accessTokenJump || '', idJump || '', id)
        if (isSuccessTask) {
          countTask++
        }
        await sleep(2000)
      }
      while (isAddIdJumpMainActive) {
        await sleep(5000)
      }
      isAddIdJumpMainActive = true
      await addIdJump(accessTokenHoneygain, idMain)
      isAddIdJumpMainActive = false
      await sleep(5000)
      const achievementIds = await getAchievementIdsForJumpTask(accessTokenHoneygain)
      if (achievementIds) {
        const { jumpTaskGainerId, jumpTaskProId } = achievementIds
        const code = await claimRewardsHoneygain(accessTokenHoneygain, jumpTaskGainerId || '')
        if (code == 200) {
          coin = coin + 0.02
        }
        await sleep(1000)
        const code2 = await claimRewardsHoneygain(accessTokenHoneygain, jumpTaskProId || '')
        if (code2 == 200) {
          coin = coin + 0.056
        } else if (countTask >= 5) {
          await claimRewardsHoneygain(accessTokenHoneygain, jumpTaskProId || '')
        }
        console.log('Coin:', coin)
      } else {
        console.error('Failed to get achievement IDs for JumpTask')
      }
      await sleep(2000)
      if (idJump) {
        await addIdJump(accessTokenHoneygain, idJump)
      }
      await sleep(2000)
      if (accessTokenJump && idJump) {
        await deleteAccountJumps(accessTokenJump, idJump, axiosInstance)
      }
    }
  } catch (err) {
    console.error('Error in runProfile')
    await addProxyToProfile({
      profileId: profileId,
      proxy: proxy
    })
    console.log('Proxy set successfully for profile')
    if (browser) {
      await browser.close()
    }
  }
}
async function processProfile(profile: any, proxy: any) {
  // await addProxyToProfile({
  //   profileId: profile.id,
  //   proxy: proxy
  // })
  // console.log('Proxy set successfully for profile:')
  const agent = new HttpsProxyAgent(`http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`)
  const axiosInstance = axios.create({
    httpAgent: agent,
    httpsAgent: agent
  })

  await runProfile(profile.id, proxy, axiosInstance)
  currentProfileIndex = (currentProfileIndex + 1) % profiles.length
  writeFile()
}
async function run() {
  try {
    coin = await getCoin('src/utils/coin.txt')
    console.log('Coin:', coin)
    await adb.launch()
    await activeProxy()
    await activeProxyOther()
    proxyList = await loadProxiesFromFile('src/utils/proxies.txt')
    proxyOtherList = await loadProxiesFromFile('src/utils/proxiesOther.txt')
    currentProfileIndex = (await readFromFile('src/utils/currentProfileIndex.txt')) || 0
    currentProxyIndex = (await readFromFile('src/utils/currentProxyIndex.txt')) || 0
    console.log(currentProfileIndex, currentProxyIndex)
    await initializeProfiles()
    currentProfileIndex = (currentProfileIndex + 1) % profiles.length
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const profile = profiles[currentProfileIndex]
      const proxy = await getProxy(proxyList)
      if (proxy) {
        console.log(
          `Running profile:${profile.name} with proxy: ${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`
        )
      }
      //   console.log(`extra: ${currentProfileIndex + 1}: ${idJumpExtra}, ${accessTokenJumpExtra},PostIds: ${postIdsExtra}`)
      await processProfile(profile, proxy)
      await sleep(3000)
    }
  } catch (error) {
    console.error('Error in runFunction:')
  }
}
async function writeFile() {
  await writeToFile('src/utils/currentProfileIndex.txt', currentProfileIndex)
  await writeToFile('src/utils/currentProxyIndex.txt', currentProxyIndex)
  await appendToFile('src/utils/coin.txt', coin)
}
export async function getProxy(proxyList: ProxyProfile[]): Promise<ProxyProfile | null> {
  let attempts = 0
  while (attempts < proxyList.length) {
    const proxy = proxyList[currentProxyIndex]
    const isActive = await isProxyActive(proxy)
    if (isActive) {
      currentProxyIndex = (currentProxyIndex + 1) % proxyList.length
      return proxy
    }
    // Tăng currentIndex và quay về 0 nếu vượt quá độ dài proxyList
    currentProxyIndex = (currentProxyIndex + 1) % proxyList.length
    attempts++
  }
  return null // Không có proxy nào hoạt động
}
run()
