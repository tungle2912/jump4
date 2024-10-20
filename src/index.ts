import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { connect } from 'puppeteer'
import emulatorController from '~/controllers/emulator.controllers'
import { sleep } from '~/lib/utils'
import GoLogin from '~/services/gologin'
import { filterActiveProxies, proxies } from '~/services/proxy'
import {
  addIdJump,
  claimRewardsHoneygain,
  confirmUserRegistration,
  confirmWithOTP,
  createRandomEmail,
  deleteAccountJumps,
  enterBonusCodeJumptask,
  fetchNewAccessToken,
  followXJumptask,
  getAchievementIdsForJumpTask,
  getAllPostFollowId,
  getCodeEmail,
  getIdJump,
  loginJumptask,
  loginTwitterOnJumptask,
  registerHoneygain,
  unlockAchievementsHoneygain,
  verifyEmail
} from '~/utils/utlis'
import { addProxyToProfile, getProfles } from './api/gologin'
import adb from './services/appium-adb'

const profiles: any[] = []
let currentProfileIndex = 0
let currentProxyIndex = 0
let profileCounter = 1
const idMain = 'aacbe798-3eb4-4a94-859a-b7d8d36d07e4'
let accessTokenJumpExtra: any = ''
let idJumpExtra: any = ''
let postIdsExtra: any[] = []
let axiosExtraInstance: any
let isFirst: boolean = true

async function runProfileExtra(profileId: string, axiosInstance: any) {
  const { launch } = await GoLogin()
  try {
    const originalConsoleLog = console.log
    console.log = function () {} // Tắt console log
    const { browser: goLoginBrowser } = await launch({
      profileId: profileId,
      headless: false
    })
    console.log = originalConsoleLog
    const browser = await connect({
      browserWSEndpoint: goLoginBrowser?.wsEndpoint(),
      defaultViewport: null,
      protocolTimeout: 60000
    })
    const pages = await browser.pages()
    const jumptask = pages[0]
    await jumptask.goto('https://app.jumptask.io/earn', {
      timeout: 60000,
      waitUntil: 'networkidle2'
    })
    await jumptask.bringToFront()
    await loginJumptask(browser, jumptask)
    await sleep(5000)
    accessTokenJumpExtra = await jumptask.evaluate(() => localStorage.getItem('JWT'))
    console.log('Access token Profile extra:', accessTokenJumpExtra)
    idJumpExtra = await getIdJump(accessTokenJumpExtra || '')
    console.log('Profile extra idJump:', idJumpExtra)
    await loginTwitterOnJumptask(browser)
    await enterBonusCodeJumptask(accessTokenJumpExtra as string, axiosInstance)
    await sleep(2000)
    postIdsExtra = await getAllPostFollowId(accessTokenJumpExtra || '', axiosInstance)
    console.log('postids extra: ', postIdsExtra)
    await browser.close()
    return { idJumpExtra, accessTokenJumpExtra, postIdsExtra }
  } catch (err) {
    console.error('Error in runProfileForJumpId:', err)
  }
}

async function runProfile(
  profileId: string,
  axiosInstance: any,
  accessTokenJumpExtra: any,
  idJumpExtra: any,
  axiosExtraInstance: any
) {
  const { launch } = await GoLogin()
  try {
    const originalConsoleLog = console.log
    console.log = function () {}
    const { browser: goLoginBrowser } = await launch({
      profileId: profileId,
      headless: false
    })
    console.log = originalConsoleLog

    const browser = await connect({
      browserWSEndpoint: goLoginBrowser?.wsEndpoint(),
      defaultViewport: null,
      protocolTimeout: 60000
    })

    browser.on('targetcreated', async (target) => {
      if (target.type() === 'page') {
        const page = await target.page()
        if (page) {
          const url = await page?.url()
          // if (url.includes('accounts.google.com')) {
          //   page.setViewport(null)
          // } else {
          //   page.setViewport(viewport)
          //   const session = await page.target().createCDPSession()
          //   await session.send('Browser.setWindowBounds', {
          //     windowId: (await session.send('Browser.getWindowForTarget')).windowId,
          //     bounds: viewport
          //   })
          // }
        }
      }
    })

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
    await jumptask.goto('https://app.jumptask.io/earn', {
      timeout: 60000,
      waitUntil: 'networkidle2'
    })
    await jumptask.bringToFront()
    await loginJumptask(browser, jumptask)
    await sleep(5000)
    const accessTokenJump = await jumptask.evaluate(() => {
      return localStorage.getItem('JWT')
    })
    console.log('Access token JumpTask:', accessTokenJump)
    const idJump = await getIdJump(accessTokenJump || '')
    console.log('idJump:', idJump)
    await loginTwitterOnJumptask(browser)
    await enterBonusCodeJumptask(accessTokenJump as string, axiosInstance)
    await sleep(2000)
    const postIds = await getAllPostFollowId(accessTokenJump || '', axiosInstance)
    console.log('postids: ', postIds)
    const email = await createRandomEmail(axiosInstance)
    const accessTokenHoneygain = await registerHoneygain(email as string, axiosInstance)
    await emulatorController.loginHoneygain({
      deviceId: await adb.getDeviceId(),
      email: email || ''
    })
    //  const accessTokenHoneygain = await fetchNewAccessToken(email as string, axiosInstance)
    if (accessTokenHoneygain) {
      await confirmUserRegistration(accessTokenHoneygain, axiosInstance)
      const confirmEmailLink = await verifyEmail(email, axiosInstance)
      await sleep(2000)
      if (confirmEmailLink) {
        const page = await browser.newPage()
        await page.goto(confirmEmailLink)
      }
      await sleep(5000)
      if (idJump) {
        await addIdJump(accessTokenHoneygain, idJump, axiosInstance)
        const otp = await getCodeEmail(email, axiosInstance)
        if (otp) {
          await confirmWithOTP(accessTokenHoneygain, otp, axiosInstance)
        }
        await sleep(2000)
        await addIdJump(accessTokenHoneygain, idJump, axiosInstance)
      } else {
        console.error('idJump is undefined')
      }
      await sleep(2000)
      await unlockAchievementsHoneygain(accessTokenHoneygain, axiosInstance)
      await sleep(2000)
      for (const id of postIds) {
        await followXJumptask(accessTokenJump || '', idJump || '', id, axiosInstance)
        await sleep(2000)
      }
      const postIdExtra = postIdsExtra.shift()
      if (postIdExtra) {
        await addIdJump(accessTokenHoneygain, idJumpExtra, axiosInstance)
        await sleep(2000)
        console.log(`Using profile extra idJump ${idJumpExtra}`)
        await followXJumptask(accessTokenJumpExtra || '', idJumpExtra, postIdExtra, axiosExtraInstance)
        await sleep(3000)
      }
      await addIdJump(accessTokenHoneygain, idMain, axiosInstance)
      await sleep(5000)
      const achievementIds = await getAchievementIdsForJumpTask(accessTokenHoneygain, axiosInstance)
      if (achievementIds) {
        const { jumpTaskGainerId, jumpTaskProId } = achievementIds
        await claimRewardsHoneygain(accessTokenHoneygain, jumpTaskGainerId, axiosInstance)
        await sleep(1000)
        await claimRewardsHoneygain(accessTokenHoneygain, jumpTaskProId, axiosInstance)
      } else {
        console.error('Failed to get achievement IDs for JumpTask')
      }
      await sleep(2000)
      if (idJump) {
        await addIdJump(accessTokenHoneygain, idJump, axiosInstance)
      }
      await sleep(2000)
      if (accessTokenJump && idJump) {
        await deleteAccountJumps(accessTokenJump, idJump, axiosInstance)
      }
      await browser.close()
    }
  } catch (err) {
    console.log(err)
  }
}

async function initializeProfiles() {
  const result = await getProfles()
  if (result.data.profiles.length === 0) {
    console.log('No profiles available')
    return
  }
  const sortedProfiles = result.data.profiles.sort((a, b) => a.name.localeCompare(b.name))
  profiles.push(...sortedProfiles)
}

async function processProfile(profile: any, proxy: any) {
  await addProxyToProfile({
    profileId: profile.id,
    proxy: proxy
  })
  if (postIdsExtra.length === 0) {
    if (!isFirst) {
      await deleteAccountJumps(accessTokenJumpExtra, idJumpExtra, axiosExtraInstance)
    }
    isFirst = false
    console.log('profile extra :')
    const agent = new HttpsProxyAgent(`http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`)
    axiosExtraInstance = axios.create({
      httpAgent: agent,
      httpsAgent: agent
    })
    await runProfileExtra(profile.id, axiosExtraInstance)
  } else {
    console.log('Proxy set successfully for profile:')
    const agent = new HttpsProxyAgent(`http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`)
    const axiosInstance = axios.create({
      httpAgent: agent,
      httpsAgent: agent
    })
    await runProfile(profile.id, axiosInstance, accessTokenJumpExtra, idJumpExtra, axiosExtraInstance)
  }
}

async function run() {
  try {
    await adb.launch()
    const devices = await adb.getConnectedDevices()
    if (devices.length === 0) {
      console.log('No devices connected')
      return
    }
    if (profiles.length === 0) {
      await initializeProfiles()
    }
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const activeProxies = await filterActiveProxies(proxies)
      if (activeProxies.length === 0) {
        console.log('No active proxies available')
        return
      }
      const profile = profiles[currentProfileIndex]
      const proxy = activeProxies[currentProxyIndex]
      console.log(
        `Running profile:${profile.name} with proxy: ${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`
      )
      console.log('currentIndex:', currentProfileIndex)
      console.log(`extra: ${profileCounter}: ${idJumpExtra}, ${accessTokenJumpExtra},PostIds: ${postIdsExtra}`)
      await processProfile(profile, proxy)
      currentProfileIndex = (currentProfileIndex + 1) % profiles.length
      currentProxyIndex = (currentProxyIndex + 1) % activeProxies.length
      profileCounter++
      await sleep(3000)
    }
  } catch (err: any) {
    console.error('Error in run function:', err.message)
  }
}
run()