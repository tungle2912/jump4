import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { connect } from 'puppeteer'
import emulatorController from '~/controllers/emulator.controllers'
import { confirm, sleep } from '~/lib/utils'
import GoLogin from '~/services/gologin'
import { filterActiveProxies, proxies } from '~/services/proxy'
import {
  addIdJump,
  checkLinkTwitter,
  claimRewardsHoneygain,
  confirmUserRegistration,
  confirmWithOTP,
  createRandomEmail,
  deleteAccountJumps,
  enterBonusCodeJumptask,
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
import { getProfles } from '../api/gologin'
import adb from '../services/appium-adb'

const profiles: any[] = []
let currentProfileIndex = 0
let currentProxyIndex = 0
const idMain = 'aacbe798-3eb4-4a94-859a-b7d8d36d07e4'
let accessTokenJumpExtra: any = ''
let idJumpExtra: any = ''
let postIdsExtra: any[] = []
let axiosExtraInstance: any
let isExtraSuccess: boolean = false
let isLoginHoneygainActive = false
let isAddIdJumpMainActive = false

async function runProfileExtra(profileId: string) {
  const { launch } = await GoLogin()
  try {
    const { browser: goLoginBrowser } = await launch({
      profileId: profileId,
      headless: false
    })
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
    //await jumptask.evaluate(() => window.focus())
    console.log('profile extra :')
    await jumptask.bringToFront()
    await loginJumptask(browser, jumptask)
    await sleep(5000)
    accessTokenJumpExtra = await jumptask.evaluate(() => localStorage.getItem('JWT'))
    console.log('Access token Profile extra:', accessTokenJumpExtra)
    idJumpExtra = await getIdJump(accessTokenJumpExtra || '')
    console.log('Profile extra idJump:', idJumpExtra)
    await loginTwitterOnJumptask(browser)
    await enterBonusCodeJumptask(accessTokenJumpExtra as string)
    await sleep(5000)
    postIdsExtra = await getAllPostFollowId(accessTokenJumpExtra || '')
    console.log('postids extra: ', postIdsExtra)
    const isLinkX = await checkLinkTwitter(accessTokenJumpExtra || '', idJumpExtra || '')
    if (!isLinkX) {
      await loginTwitterOnJumptask(browser)
      await sleep(5000)
    }
    await browser.close()
    isExtraSuccess = true
    return { idJumpExtra, accessTokenJumpExtra, postIdsExtra }
  } catch (err) {
    console.error('Error in runProfileForJumpId:', err)
  }
}

async function runProfile(profileId: string, axiosInstance: any, accessTokenJumpExtra: any, idJumpExtra: any) {
  const { launch } = await GoLogin()
  try {
    const { browser: goLoginBrowser } = await launch({
      profileId: profileId,
      headless: false
    })
    const browser = await connect({
      browserWSEndpoint: goLoginBrowser?.wsEndpoint(),
      defaultViewport: null,
      protocolTimeout: 60000
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
    await jumptask.goto('https://app.jumptask.io/earn', {
      timeout: 60000
    })
    await jumptask.bringToFront()
    await loginJumptask(browser, jumptask)
    await sleep(5000)
    let accessTokenJump = await jumptask.evaluate(() => {
      return localStorage.getItem('JWT')
    })
    console.log('Access token JumpTask:', accessTokenJump)
    let idJump = await getIdJump(accessTokenJump || '')
    console.log('idJump:', idJump)
    while (!accessTokenJump || !idJump) {
      accessTokenJump = await jumptask.evaluate(() => {
        return localStorage.getItem('JWT')
      })
      console.log('Access token JumpTask:', accessTokenJump)
      idJump = await getIdJump(accessTokenJump || '')
      console.log('idJump:', idJump)
      const newPage = await browser.newPage()

      await loginJumptask(browser, newPage)
    }
    await loginTwitterOnJumptask(browser)
    await enterBonusCodeJumptask(accessTokenJump as string)
    await sleep(5000)
    const postIds = await getAllPostFollowId(accessTokenJump || '')
    console.log('postids: ', postIds)
    const email = await createRandomEmail()
    const accessTokenHoneygain = await registerHoneygain(email as string, axiosInstance)
    while (isLoginHoneygainActive) {
      await sleep(5000)
    }
    isLoginHoneygainActive = true
    await emulatorController.loginHoneygain({
      deviceId: await adb.getDeviceId(),
      email: email || ''
    })
    const isLinkX = await checkLinkTwitter(accessTokenJump || '', idJump || '')
    if (!isLinkX) {
      await loginTwitterOnJumptask(browser)
      await sleep(5000)
    }
    await browser.close()
    isLoginHoneygainActive = false
    //  const accessTokenHoneygain = await fetchNewAccessToken(email as string, axiosInstance)
    if (accessTokenHoneygain) {
      await confirmUserRegistration(accessTokenHoneygain)
      const confirmEmailLink = await verifyEmail(email)
      await sleep(2000)
      // if (confirmEmailLink) {
      //   const page = await browser.newPage()
      //   await page.goto(confirmEmailLink)
      // }
      confirm(confirmEmailLink)
      await sleep(5000)
      if (idJump) {
        await addIdJump(accessTokenHoneygain, idJump)
        const otp = await getCodeEmail(email)
        if (otp) {
          await confirmWithOTP(accessTokenHoneygain, otp)
        }
        await sleep(2000)
        await addIdJump(accessTokenHoneygain, idJump)
      } else {
        console.error('idJump is undefined')
      }
      await sleep(2000)
      await unlockAchievementsHoneygain(accessTokenHoneygain)
      await sleep(2000)
      for (const id of postIds) {
        await followXJumptask(accessTokenJump || '', idJump || '', id)
        await sleep(2000)
      }
      while (!isExtraSuccess) {
        await sleep(5000)
      }
      const postIdExtra = postIdsExtra.shift()
      if (postIdExtra) {
        await addIdJump(accessTokenHoneygain, idJumpExtra)
        await sleep(2000)
        console.log(`Using profile extra idJump ${idJumpExtra}`)
        await followXJumptask(accessTokenJumpExtra || '', idJumpExtra, postIdExtra)
        const postIdExtra2 = postIdsExtra.shift()
        await followXJumptask(accessTokenJumpExtra || '', idJumpExtra, postIdExtra2)
        if (postIdsExtra.length == 1) {
          const postIdExtra3 = postIdsExtra.shift()
          await followXJumptask(accessTokenJumpExtra || '', idJumpExtra, postIdExtra3)
        }
        await sleep(3000)
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
        await claimRewardsHoneygain(accessTokenHoneygain, jumpTaskGainerId || '')
        await sleep(1000)
        await claimRewardsHoneygain(accessTokenHoneygain, jumpTaskProId || '')
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
    console.log(err)
  }
}

async function initializeProfiles() {
  const result = await getProfles()
  if (result.data.profiles.length === 0) {
    console.log('No profiles available')
    return
  }
  const sortedProfiles = result.data.profiles.sort((a: any, b: any) => a.name.localeCompare(b.name))
  profiles.push(...sortedProfiles)
}

async function processProfile(profile: any, proxy: any) {
  // await addProxyToProfile({
  //   profileId: profile.id,
  //   proxy: proxy
  // })
  const activeProxies = await filterActiveProxies(proxies)
  if (activeProxies.length === 0) {
    console.log('No active proxies available')
    return
  }
  console.log('Proxy set successfully for profile:')
  const agent = new HttpsProxyAgent(`http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`)
  const axiosInstance = axios.create({
    httpAgent: agent,
    httpsAgent: agent
  })
  currentProxyIndex = (currentProxyIndex + 1) % proxies.length
  currentProfileIndex = (currentProfileIndex + 1) % profiles.length
  const profile2 = profiles[currentProfileIndex]
  await Promise.all([
    await runProfileExtra(profile.id),
    await runProfile(profile2.id, axiosInstance, accessTokenJumpExtra, idJumpExtra)
  ])
  console.log('Deleted account jumps for profile extra')
  const proxyExtra = activeProxies[currentProxyIndex]
  const agent2 = new HttpsProxyAgent(
    `http://${proxyExtra.username}:${proxyExtra.password}@${proxyExtra.host}:${proxyExtra.port}`
  )
  axiosExtraInstance = axios.create({
    httpAgent: agent2,
    httpsAgent: agent2
  })
  await deleteAccountJumps(accessTokenJumpExtra, idJumpExtra, axiosExtraInstance)
  currentProfileIndex = (currentProfileIndex + 1) % profiles.length
  currentProxyIndex = (currentProxyIndex + 1) % activeProxies.length
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
      console.log(`extra: ${currentProfileIndex + 1}: ${idJumpExtra}, ${accessTokenJumpExtra},PostIds: ${postIdsExtra}`)
      await processProfile(profile, proxy)
      await sleep(3000)
    }
  } catch (err: any) {
    console.error('Error in run function:', err.message)
  }
}
run()