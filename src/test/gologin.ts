import { getBrowserCookies, getProfles } from '~/api/gologin'
import chalk from '~/lib/chalk'
import { log, sleep } from '~/lib/utils'
import GoLogin from '~/services/gologin'

import { connect } from 'puppeteer'
;(async () => {
  const { launch } = await GoLogin()
  const { warning, message } = await chalk()
  try {
    const profiles = await getProfles()
    profiles.data.profiles.map(({ id }) => {
      log(id)
    })
    profiles.data.profiles.forEach(({ id, name }) => {
      log(message(name), id)
    })
    const firstProfile = profiles.data.profiles[0]
    if (profiles.data.profiles.length === 0) {
      log(warning('No profiles available'))
      return
    }
    const { browser: goLoginBrowser } = await launch({
      profileId: '66b88816b9dbab17aa2ccfcd',
      headless: true
    })

    console.log(firstProfile.id)
    const puppeteerBrowser = await connect({
      browserWSEndpoint: goLoginBrowser?.wsEndpoint(),
      ignoreHTTPSErrors: true
    })
    const _pages = await puppeteerBrowser.pages()
    console.log(_pages)

    // Lắng nghe việc đóng trang
    puppeteerBrowser.on('targetcreated', async (target) => {
      if (target.type() === 'page') {
        const page = await target.page()
        if (page) {
          page.setViewport(null)
        }
      }
    })

    const pages = await puppeteerBrowser.pages()
    if (pages.length > 1) {
      await pages[0].close()
    } else {
      await pages[0].setViewport(null)
    }

    const [jumptask, mailtm] = await Promise.all([await puppeteerBrowser.newPage(), await puppeteerBrowser.newPage()])
    await Promise.all([await jumptask.goto('https://app.jumptask.io/earn'), await mailtm.goto('https://mail.tm/en/')])
  } catch (err) {
    log(err)
  }
})()
