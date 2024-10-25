import { connect } from 'puppeteer'
import emulatorController from '~/controllers/emulator.controllers'
import { confirm, sleep } from '~/lib/utils'
import GoLogin from '~/services/gologin'
import {
  addFirstIdJump,
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
  loginMail,
  loginTwitterOnJumptask,
  registerHoneygain,
  unlockAchievementsHoneygain,
  verifyEmail
} from '~/utils/utlis'
import adb from '../services/appium-adb'
import { getProfles } from '~/api/gologin'
async function runProfile5() {
  const { launch } = await GoLogin()
  try {
    const result = await getProfles()
    const { browser: goLoginBrowser } = await launch({
      profileId: result.data.profiles[0].id,
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
    await jumptask.goto('https://app.jumptask.io/earn')
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
    const emailData = await createRandomEmail()
    if (!emailData) {
      throw new Error('Failed to create random email')
    }
    const { email, password } = emailData
    const tokenMail = await loginMail(email, password)
  } catch (err) {
    console.log(err)
  }
}
runProfile5()