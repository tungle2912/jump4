import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { connect } from 'puppeteer'
import emulatorController from '~/controllers/emulator.controllers'
import { confirm, sleep } from '~/lib/utils'
import GoLogin from '~/services/gologin'
import { filterActiveProxies, proxies } from '~/services/proxy'
import {
  addFirstIdJump,
  addIdJump,
  appendToFile,
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
import envVariables from '~/constants/env-variables'
const access =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6ImNyZWRzIiwic3ViIjoiOWJiNDNhMmUtYmViMC00NDA4LTg3OTgtMWFkZTA5MWJiMmI0IiwiZXhwIjoxNzMyMTA4NDMxLCJpYXQiOjE3Mjk1MTY0MzEsImp0aSI6ImYxYjE5MzE0LTVjYmUtNDAwZC04NWIwLWVhYjBiZWNkMWM0OCJ9.3FS02ptersjyGOJVSh74Vn57PnrVZoin9Ke-tTpZ7pTptKOnbJiY2DZuSaYfEb0eqwEIcnwZjZjLalyFPNpICg'
const profiles: any[] = []
let currentProfileIndex = 0
let currentProxyIndex = 0
const idMain = envVariables.JUMPTASK_ID
let accessTokenJumpExtra: any = ''
let idJumpExtra: any = ''
let postIdsExtra: any[] = []
let axiosExtraInstance: any
let isFirst: boolean = true
let isLoginHoneygainActive = false
let isAddIdJumpMainActive = false
let isUnlockActive = false
let coin = 0
async function initializeProfiles() {
  const result = await getProfles()
  if (result.data.profiles.length === 0) {
    console.log('No profiles available')
    return
  }
  const sortedProfiles = result.data.profiles.sort((a: any, b: any) => b.name.localeCompare(a.name))
  profiles.push(...sortedProfiles)
}
async function runProfileExtra(profileId: string, proxy: any) {
  const { launch } = await GoLogin()
  let goLoginBrowser
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
    await jumptask.goto('https://app.jumptask.io/earn')
    //await jumptask.evaluate(() => window.focus())
    await jumptask.bringToFront()
    const checkLogin = await loginJumptask(browser, jumptask)
    if (!checkLogin) {
      await browser.close()
      return
    }
    await sleep(5000)
    accessTokenJumpExtra = await jumptask.evaluate(() => localStorage.getItem('JWT'))
    console.log('Access token Profile extra:', accessTokenJumpExtra)
    if (!accessTokenJumpExtra) {
      browser.close()
      return
    }
    idJumpExtra = await getIdJump(accessTokenJumpExtra || '')
    console.log('Profile extra idJump:', idJumpExtra)
    await loginTwitterOnJumptask(browser, profileId, proxy)
    await enterBonusCodeJumptask(accessTokenJumpExtra as string)
    await sleep(5000)
    postIdsExtra = await getAllPostFollowId(accessTokenJumpExtra || '')
    console.log('postids extra: ', postIdsExtra)
    await browser.close()
    return { idJumpExtra, accessTokenJumpExtra, postIdsExtra }
  } catch (err) {
    console.log('Error in runProfileForJumpId:')
  }
}
async function runProfile5(profileId: string, proxy: any, axiosInstance: any) {
  const { launch } = await GoLogin()
  let goLoginBrowser
  let browser
  let accessTokenJump
  let idJump
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
    accessTokenJump = await jumptask.evaluate(() => {
      return localStorage.getItem('JWT')
    })
    console.log('Access token JumpTask:', accessTokenJump)
    if (!accessTokenJump) {
      browser.close()
      return
    }
    idJump = await getIdJump(accessTokenJump || '')
    console.log('idJump:', idJump)

    const check = await loginTwitterOnJumptask(browser, profileId, proxy)
    if (!check) {
      await browser.close()
      return
    }
    await enterBonusCodeJumptask(accessTokenJump as string)
    await sleep(5000)
    const postIds = await getAllPostFollowId(accessTokenJump || '')
    console.log('postids: ', postIds)
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
      email: email || ''
    })
    await browser.close()
    isLoginHoneygainActive = false
    //  const accessTokenHoneygain = await fetchNewAccessToken(email as string, axiosInstance)
    if (accessTokenHoneygain) {
      await confirmUserRegistration(accessTokenHoneygain)
      const confirmEmailLink = await verifyEmail(tokenMail)
      await sleep(2000)
      // if (confirmEmailLink) {
      //   const page = await browser.newPage()
      //   await page.goto(confirmEmailLink)
      // }
      await confirm(confirmEmailLink)
      await sleep(5000)
      let countTask = 0
      try {
        if (idJump) {
          await addFirstIdJump(accessTokenHoneygain, idJump)
          const otp = await getCodeEmail(tokenMail)
          if (otp) {
            await confirmWithOTP(accessTokenHoneygain, otp)
          }
          await sleep(2000)
          await addIdJump(accessTokenHoneygain, idJump)
        } else {
          console.error('idJump is undefined')
        }
        await sleep(2000)
        while (isUnlockActive) {
          await sleep(5000)
        }
        isUnlockActive = true
        await unlockAchievementsHoneygain(accessTokenHoneygain, email)
        isUnlockActive = false
        await sleep(2000)
        for (const id of postIds) {
          const isSuccessTask = await followXJumptask(accessTokenJump || '', idJump || '', id)
          if (isSuccessTask) {
            countTask++
          }
          await sleep(2000)
        }
      } catch (error) {
        console.error('Error run profile....')
        if (accessTokenJump && idJump) {
          console.log('Delete account jumps....')
          await deleteAccountJumps(accessTokenJump, idJump, axiosInstance)
        }
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
    console.log('Failed to run profile')
    if (browser) {
      browser.close()
    }
  }
}
async function runProfile4(
  profileId: string,
  proxy: any,
  axiosInstance: any,
  accessTokenJumpExtra: any,
  idJumpExtra: any
) {
  const { launch } = await GoLogin()
  let goLoginBrowser
  let browser
  let accessTokenJump
  let idJump
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
    accessTokenJump = await jumptask.evaluate(() => {
      return localStorage.getItem('JWT')
    })
    console.log('Access token JumpTask:', accessTokenJump)
    if (!accessTokenJump) {
      browser.close()
      return
    }
    idJump = await getIdJump(accessTokenJump || '')
    console.log('idJump:', idJump)

    const check = await loginTwitterOnJumptask(browser, profileId, proxy)
    if (!check) {
      await browser.close()
      return
    }
    await enterBonusCodeJumptask(accessTokenJump as string)
    await sleep(5000)
    const postIds = await getAllPostFollowId(accessTokenJump || '')
    console.log('postids: ', postIds)
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
      email: email || ''
    })
    await browser.close()
    isLoginHoneygainActive = false
    //  const accessTokenHoneygain = await fetchNewAccessToken(email as string, axiosInstance)
    if (accessTokenHoneygain) {
      await confirmUserRegistration(accessTokenHoneygain)
      const confirmEmailLink = await verifyEmail(tokenMail)
      await sleep(2000)
      // if (confirmEmailLink) {
      //   const page = await browser.newPage()
      //   await page.goto(confirmEmailLink)
      // }
      await confirm(confirmEmailLink)
      await sleep(5000)
      let countTask = 0
      if (idJump) {
        await addFirstIdJump(accessTokenHoneygain, idJump)
        const otp = await getCodeEmail(tokenMail)
        if (otp) {
          await confirmWithOTP(accessTokenHoneygain, otp)
        }
        await sleep(2000)
        await addIdJump(accessTokenHoneygain, idJump)
      } else {
        console.error('idJump is undefined')
      }
      await sleep(2000)
      while (isUnlockActive) {
        await sleep(5000)
      }
      isUnlockActive = true
      await unlockAchievementsHoneygain(accessTokenHoneygain, email)
      isUnlockActive = false
      await sleep(2000)
      for (const id of postIds) {
        const isSuccessTask = await followXJumptask(accessTokenJump || '', idJump || '', id)
        if (isSuccessTask) {
          countTask++
        }
        await sleep(2000)
      }

      const postIdExtra = postIdsExtra.shift()
      if (postIdExtra) {
        try {
          await addIdJump(accessTokenHoneygain, idJumpExtra)
        } catch (error) {
          console.error('Error add idJump extra....')
          await deleteAccountJumps(accessTokenJumpExtra, idJumpExtra, axiosInstance)
        }
        await sleep(4000)
        console.log(`Using profile extra idJump ${idJumpExtra}`)
        const isSuccessTask = await followXJumptask(accessTokenJumpExtra || '', idJumpExtra, postIdExtra)
        if (isSuccessTask) {
          countTask++
        }
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
    console.log('Failed to run profile')
    if (browser) {
      browser.close()
    }
  }
}
async function runProfile3(
  profileId: string,
  proxy: any,
  axiosInstance: any,
  accessTokenJumpExtra: any,
  idJumpExtra: any
) {
  const { launch } = await GoLogin()
  let goLoginBrowser
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
      timeout: 60000,
      waitUntil: 'networkidle2'
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
    const check = await loginTwitterOnJumptask(browser, profileId, proxy)
    if (!check) {
      await browser.close()
      return
    }
    await enterBonusCodeJumptask(accessTokenJump as string)
    await sleep(5000)
    const postIds = await getAllPostFollowId(accessTokenJump || '')
    console.log('postids: ', postIds)
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
      email: email || ''
    })
    await browser.close()
    isLoginHoneygainActive = false
    //  const accessTokenHoneygain = await fetchNewAccessToken(email as string, axiosInstance)
    if (accessTokenHoneygain) {
      await confirmUserRegistration(accessTokenHoneygain)
      const confirmEmailLink = await verifyEmail(tokenMail)
      await sleep(2000)
      // if (confirmEmailLink) {
      //   const page = await browser.newPage()
      //   await page.goto(confirmEmailLink)
      // }
      await confirm(confirmEmailLink)
      await sleep(5000)
      if (idJump) {
        await addFirstIdJump(accessTokenHoneygain, idJump)
        const otp = await getCodeEmail(tokenMail)
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
      for (const id of postIds) {
        await followXJumptask(accessTokenJump || '', idJump || '', id)
        await sleep(2000)
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
        const code = await claimRewardsHoneygain(accessTokenHoneygain, jumpTaskGainerId || '')
        if (code == 200) {
          coin = coin + 0.02
        }
        await sleep(1000)
        const code2 = await claimRewardsHoneygain(accessTokenHoneygain, jumpTaskProId || '')
        if (code2 == 200) {
          coin = coin + 0.056
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
    console.log(err)
  }
}
async function processProfile(profile: any, proxy: any, count: number, activeProxies: any) {
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
  switch (true) {
    case count >= 5: {
      const proxy2 = activeProxies[currentProxyIndex]
      const agent2 = new HttpsProxyAgent(`http://${proxy2.username}:${proxy2.password}@${proxy2.host}:${proxy2.port}`)
      const axiosInstance2 = axios.create({
        httpAgent: agent2,
        httpsAgent: agent2
      })
      currentProfileIndex = (currentProfileIndex + 1) % profiles.length
      currentProxyIndex = (currentProxyIndex + 1) % proxies.length
      const profile2 = profiles[currentProfileIndex]
      await Promise.all([
        runProfile5(profile.id, proxy, axiosInstance),
        runProfile5(profile2.id, proxy2, axiosInstance2)
      ])
      currentProfileIndex = (currentProfileIndex + 1) % profiles.length
      currentProxyIndex = (currentProxyIndex + 1) % activeProxies.length
      writeFile()
      break
    }
    case count == 4:
      if (postIdsExtra.length === 0) {
        if (!isFirst) {
          const proxyExtra = activeProxies[currentProxyIndex]
          const agent = new HttpsProxyAgent(
            `http://${proxyExtra.username}:${proxyExtra.password}@${proxyExtra.host}:${proxyExtra.port}`
          )
          axiosExtraInstance = axios.create({
            httpAgent: agent,
            httpsAgent: agent
          })
          currentProxyIndex = (currentProxyIndex + 1) % proxies.length
          if (accessTokenJumpExtra && idJumpExtra) {
            await deleteAccountJumps(accessTokenJumpExtra, idJumpExtra, axiosExtraInstance)
            accessTokenJumpExtra = null
            idJumpExtra = null
          }
          console.log('Deleted account jumps for profile extra')
        }
        isFirst = false
        console.log('profile extra :')
        await runProfileExtra(profile.id, proxy)
        const check = await checkLinkTwitter(accessTokenJumpExtra || '', idJumpExtra || '')
        if (!check) {
          postIdsExtra = []
        }
        currentProfileIndex = (currentProfileIndex + 1) % profiles.length
        currentProxyIndex = (currentProxyIndex + 1) % activeProxies.length
        writeFile()
      } else {
        if (postIdsExtra.length % 2 == 0) {
          const proxy2 = activeProxies[currentProxyIndex]
          const agent = new HttpsProxyAgent(
            `http://${proxy2.username}:${proxy2.password}@${proxy2.host}:${proxy2.port}`
          )
          const axiosInstance2 = axios.create({
            httpAgent: agent,
            httpsAgent: agent
          })
          currentProfileIndex = (currentProfileIndex + 1) % profiles.length
          currentProxyIndex = (currentProxyIndex + 1) % proxies.length
          const profile2 = profiles[currentProfileIndex]
          await Promise.all([
            runProfile4(profile.id, proxy, axiosInstance, accessTokenJumpExtra, idJumpExtra),
            runProfile4(profile2.id, proxy2, axiosInstance2, accessTokenJumpExtra, idJumpExtra)
          ])
          currentProfileIndex = (currentProfileIndex + 1) % profiles.length
          currentProxyIndex = (currentProxyIndex + 1) % activeProxies.length
          writeFile()
        } else {
          await runProfile4(profile.id, proxy, axiosInstance, accessTokenJumpExtra, idJumpExtra),
            (currentProfileIndex = (currentProfileIndex + 1) % profiles.length)
          currentProxyIndex = (currentProxyIndex + 1) % activeProxies.length
          writeFile()
        }
      }
      break
    case count == 3:
      if (postIdsExtra.length === 0) {
        if (!isFirst) {
          const proxyExtra = activeProxies[currentProxyIndex]
          const agent = new HttpsProxyAgent(
            `http://${proxyExtra.username}:${proxyExtra.password}@${proxyExtra.host}:${proxyExtra.port}`
          )
          axiosExtraInstance = axios.create({
            httpAgent: agent,
            httpsAgent: agent
          })
          currentProxyIndex = (currentProxyIndex + 1) % proxies.length
          await deleteAccountJumps(accessTokenJumpExtra, idJumpExtra, axiosExtraInstance)
          console.log('Deleted account jumps for profile extra')
        }
        isFirst = false
        console.log('profile extra :')
        await runProfileExtra(profile.id, proxy)
        currentProfileIndex = (currentProfileIndex + 1) % profiles.length
        writeFile()
      } else {
        await runProfile3(profile.id, proxy, axiosInstance, accessTokenJumpExtra, idJumpExtra),
          (currentProfileIndex = (currentProfileIndex + 1) % profiles.length)
        currentProxyIndex = (currentProxyIndex + 1) % activeProxies.length
        writeFile()
      }
      break
  }
}
async function run() {
  try {
    await adb.launch()
    currentProfileIndex = (await readFromFile('src/utils/currentProfileIndex.txt')) || 0
    currentProxyIndex = (await readFromFile('src/utils/currentProxyIndex.txt')) || 0
    console.log(currentProfileIndex, currentProxyIndex)
    const activeProxies = await filterActiveProxies(proxies)
    await initializeProfiles()
    currentProfileIndex = (currentProfileIndex + 1) % profiles.length
    currentProxyIndex = (currentProxyIndex + 1) % activeProxies.length
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const Postids = await getAllPostFollowId(access || '')
      const count = Postids.length
      console.log('count Post:', count)
      const activeProxies = await filterActiveProxies(proxies)
      if (activeProxies.length === 0) {
        console.log('No active proxies available')
        return
      }
      const profile = profiles[currentProfileIndex]
      let proxy
      try {
        proxy = activeProxies[currentProxyIndex]
        console.log(
          `Running profile:${profile.name} with proxy: ${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`
        )
      } catch {
        console.log('Proxy index out of bounds. Resetting currentProxyIndex to 0.')
        currentProxyIndex = 0
        proxy = activeProxies[currentProxyIndex]
      }
      console.log('currentIndex:', currentProfileIndex)
      console.log(`extra: ${currentProfileIndex + 1}: ${idJumpExtra}, ${accessTokenJumpExtra},PostIds: ${postIdsExtra}`)
      await processProfile(profile, proxy, count, activeProxies)
      await sleep(3000)
    }
  } catch (err: any) {
    console.error('Error in run function:', err.message)
  }
}
async function writeFile() {
  await writeToFile('src/utils/currentProfileIndex.txt', currentProfileIndex)
  await writeToFile('src/utils/currentProxyIndex.txt', currentProxyIndex)
  await appendToFile('src/utils/coin.txt', coin)
}
run()
