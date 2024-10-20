import { Browser, Page, Target } from 'puppeteer'
import puppeteer from 'puppeteer-extra'
import envVariables from '../constants/env-variables'
import { log, sleep } from '../lib/utils'

const gologinExecutablePath = 'C:\\Users\\LENOVO\\.gologin\\browser\\orbita-browser-126\\chrome.exe'
const chromeExecutablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

export const launchBrowser = async ({
  executablePath = gologinExecutablePath,
  defaultViewport = null,
  headless = false
}: {
  executablePath?: string
  headless?: boolean
  defaultViewport?: null | { width: number; height: number }
}) => {
  try {
    const browser = await puppeteer.launch({
      headless: headless,
      defaultViewport: defaultViewport,
      executablePath: executablePath
    })
    return browser
  } catch (error) {
    log('Error launching browser:', error)
    throw error
  }
}

export const loginGoogle = async (browser: Browser) => {
  try {
    const google = await browser.newPage()
    await google.goto('https://www.google.com/intl/vi/gmail/about/')
    await google.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[]
      const btn = buttons.find((button) => button.innerText?.trim() === 'Đăng nhập')
      if (btn) {
        btn.click()
      }
    })
    await google.waitForSelector('#identifierId', { visible: true, timeout: 60000 })
    await sleep(1000)
    await google.type('#identifierId', envVariables.EMAIL as string, { delay: 10 })
    await google.click('#identifierNext')
    await google.waitForSelector('input[name="Passwd"]', { visible: true, timeout: 60000 })
    await google.type('input[name="Passwd"]', envVariables.PASSWORD as string)
    await google.keyboard.press('Enter')
    await sleep(4000)
    const needsRecoveryEmail = await google.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('li')) as HTMLLIElement[]
      return buttons.some((button) => button.innerText?.trim() === 'Confirm your recovery email')
    })
    log('needsRecoveryEmail', needsRecoveryEmail)
    if (needsRecoveryEmail) {
      log('Yêu cầu xác nhận email khôi phục')
      await google.waitForSelector('div[data-challengeid="5"]', { visible: true, timeout: 60000 })
      await google.click('div[data-challengeid="5"]')
      await sleep(1000)
      await google.waitForSelector('#knowledge-preregistered-email-response', { visible: true, timeout: 60000 })
      await sleep(1000)
      await google.type('#knowledge-preregistered-email-response', 'le2082170@gmail.com', { delay: 10 })
      await google.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
        const btn = buttons.find((button) => button.innerText?.trim() === 'Next')
        if (btn) {
          btn.click()
        }
      })
    }
    await sleep(2000)
    await google.close()
  } catch (error) {
    log('Error in loginGoogle:', error)
  }
}

export const loginWithGoogleToJumptask = async (browser: Browser, jumptask: Page) => {
  try {
    //   await jumptask.bringToFront()
    await jumptask.waitForSelector('button>p.MuiTypography-body1', { visible: true, timeout: 60000 })
    await jumptask.click('button[type="button"]>p.MuiTypography-body1')

    const newPagePromise = new Promise<Page>((resolve, reject) => {
      const handleTargetCreated = async (target: Target) => {
        try {
          const newPage = await target.page()
          if (newPage && target.url().includes('accounts.google.com')) {
            browser.off('targetcreated', handleTargetCreated)
            resolve(newPage)
          }
        } catch (err) {
          browser.off('targetcreated', handleTargetCreated)
          reject(err)
        }
      }
      browser.on('targetcreated', handleTargetCreated)
    })
    const newPage = await newPagePromise
    await newPage.waitForSelector('.VV3oRb.YZVTmd', { visible: true })
    await newPage.click('.VV3oRb.YZVTmd')
    await sleep(2000)
    // await newPage.evaluate(() => {
    //   const buttons = Array.from(document.querySelectorAll('div')) as HTMLDivElement[]
    //   const addButton = buttons.find((button) => button.innerText?.trim() === 'Confirm')
    //   if (addButton) {
    //     addButton.click()
    //   }
    // })
    console.log('Đăng nhập thành công!')
  } catch (err: any) {
    console.log('Đã xảy ra lỗi trong quá trình đăng nhập Jumptask')
    console.log(err?.message)
  }
}

export const getIdJumpTask = async (browser: Browser) => {
  try {
    const jumptaskAccountPage = await browser.newPage()
    await jumptaskAccountPage.goto('https://app.jumptask.io/my-account')
    let id = ''
    while (id === '') {
      id = await jumptaskAccountPage.evaluate(() => {
        const elements = Array.from(
          document.querySelectorAll('p.MuiTypography-root.MuiTypography-body2.css-jc981')
        ) as HTMLParagraphElement[]
        for (const element of elements) {
          const text = element.innerText
          if (!text.includes('@gmail') && !text.includes('Delete')) {
            return text
          }
        }
        return ''
      })
      if (id !== '') {
        return id
      }
      await sleep(1000)
    }
  } catch (error) {
    console.log('Error in getIdJumpTask:', error)
  }
}

export const getEmailFromMailTemp = async (mailTemp: Page) => {
  try {
    await mailTemp.waitForSelector('input#Dont_use_WEB_use_API')
    let _email = ''
    while (_email === '' || !_email.includes('.com')) {
      _email = await mailTemp.evaluate(() => {
        return (document.getElementById('Dont_use_WEB_use_API') as HTMLInputElement).value
      })
    }
    return _email
  } catch (error) {
    log('Error in getEmailFromMailTemp:', error)
  }
}

export const signUpHoneyGain = async (honeygain: Page, email: string) => {
  try {
    await sleep(5000)
    await honeygain.waitForSelector('input#email', { visible: true, timeout: 60000 })
    await honeygain.type('input#email', email, { delay: 10 })
    await honeygain.type('input#password', email, { delay: 10 })
    await honeygain.keyboard.press('Enter')
    await sleep(5000)
  } catch (err) {
    console.log('Xảy ra lỗi trong quá trình đăng ký Honeygain: ', err)
  }
}

export const clickElementInPage = async (browser: Browser, page: string, selector: string) => {
  try {
    const jumptaskHoneyPage = await browser.newPage()
    await jumptaskHoneyPage.goto(page)
    await sleep(3000)
    await jumptaskHoneyPage.waitForSelector(selector, { visible: true, timeout: 60000 })
    await jumptaskHoneyPage.click(selector)
    await sleep(2000)
    await jumptaskHoneyPage.close()
  } catch (error) {
    log('Error in clickElementInPage:', error)
  }
}

export const followTwitterOnJumptask = async (browser: Browser) => {
  try {
    const jumptask = await browser.newPage()
    await jumptask.goto('https://app.jumptask.io/earn')
    const pages = await browser.pages()
    pages.pop()
    for (const page of pages) {
      await page.close()
    }
    await sleep(4000)
    await jumptask.waitForSelector('p.MuiTypography-root.MuiTypography-body1')
    const tasks = await jumptask.evaluate(() => {
      const elements = Array.from(
        document.querySelectorAll('p.MuiTypography-root.MuiTypography-body1')
      ) as HTMLElement[]
      return elements
        .map((el, index) => ({
          outerHTML: el.outerHTML,
          index: index,
          textContent: el.textContent
        }))
        .filter(
          (task) =>
            task.textContent?.includes('Follow') &&
            (task.textContent?.includes('in X!') || task.textContent?.includes('on X!'))
        )
    })

    log('Tasks found:', tasks)
    const taskFollow = tasks.slice(0, 9)
    for (const task of taskFollow) {
      await jumptask.evaluate((index: number) => {
        const elements = Array.from(
          document.querySelectorAll('p.MuiTypography-root.MuiTypography-body1')
        ) as HTMLElement[]
        const targetElement = elements[index]
        if (targetElement) {
          targetElement.click()
        } else {
          console.log('Element not found for index:', index)
        }
      }, task.index)
      await sleep(3000)
      const checkbox = await jumptask.$('span input[type="checkbox"]')
      if (checkbox) {
        await checkbox.click()
      } else {
        console.log('Checkbox not found.')
      }
      await jumptask.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button[type="button"]')) as HTMLButtonElement[]
        const followButton = buttons.find((button) => button.textContent?.trim() === 'Follow')
        if (followButton) {
          followButton.click()
        }
      })
      await sleep(3000)
    }
  } catch (error) {
    log('Error in followTwitterOnJumptask:', error)
    await deleteJumptaskAccount(browser)
    await browser.close()
  }
}

export const deleteJumptaskAccount = async (browser: Browser) => {
  try {
    const jumptaskAccountPage = await browser.newPage()
    await jumptaskAccountPage.goto('https://app.jumptask.io/my-account')
    await jumptaskAccountPage.waitForSelector('div[role="button"]')
    await jumptaskAccountPage.click('div[role="button"]')

    await jumptaskAccountPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.MuiListItemButton-root')) as HTMLButtonElement[]
      for (const button of buttons) {
        const primaryText = button.querySelector('.MuiListItemText-primary')
        if (primaryText && primaryText.textContent?.includes('Delete my account')) {
          button.click()
          break
        }
      }
    })

    await jumptaskAccountPage.waitForSelector('input.MuiInputBase-input')
    await jumptaskAccountPage.type('input.MuiInputBase-input', 'delete account forever', {
      delay: 5
    })
    await jumptaskAccountPage.keyboard.press('Enter')
    log('Đã xóa tài khoản Jumptask')
    await sleep(7000)
  } catch (error) {
    log('Error in deleteJumptaskAccount:', error)
  }
}

export const clickElementMailTemp = async (mailTemp: Page) => {
  try {
    await sleep(3000)
    await mailTemp.reload()
    await sleep(3000)
    await mailTemp.waitForSelector('ul li a')
    await mailTemp.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('ul li a')) as HTMLElement[]
      if (elements) {
        const element = elements[0]
        element.click()
      } else {
        console.log('Element not found')
      }
    })
  } catch (error) {
    log('Error in clickElementMailTemp:', error)
  }
}

export const confirmEmailFromMailTemp = async (browser: Browser) => {
  try {
    const mailTemp = await browser.newPage()
    await mailTemp.goto('https://mail.tm/en/')
    await sleep(3000)
    await mailTemp.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('ul li a')) as HTMLElement[]
      if (elements) {
        const element = elements[0]
        element.click()
      } else {
        console.log('Element not found')
      }
    })
    await sleep(3000)
    await mailTemp.waitForSelector('iframe.w-full')
    const iframeElement = await mailTemp.$('iframe.w-full')
    const iframe = await iframeElement?.contentFrame()
    const link = await (iframe as any)?.evaluateHandle(() => {
      const anchors = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[]
      return anchors.find((anchor) => anchor.textContent?.includes('Confirm email'))
    })
    if (link) {
      link.click()
    } else {
      console.log('Không tìm thấy liên kết')
    }
  } catch (error) {
    log('Error in confirmEmailFromMailTemp:', error)
  }
}

const loginTwitterOnJumptask = async (browser: Browser, profileName: string) => {
  try {
    const linkTwitterPage = await browser.newPage()
    await linkTwitterPage.goto('https://app.jumptask.io/social-accounts')
    const pages = await browser.pages()
    pages.pop()
    for (const page of pages) {
      await page.close()
    }
    await linkTwitterPage.waitForSelector('button[data-testid="link-social"]')
    const checkCircleIcon = await linkTwitterPage.$('svg[data-testid="CheckCircleIcon"]')
    if (checkCircleIcon) {
      console.log('Đã tìm thấy biểu tượng CheckCircleIcon. Không thực hiện thêm hành động nào.')
      return
    }
    const buttons = await linkTwitterPage.$$('button[data-testid="link-social"]')
    if (buttons.length > 0) {
      await buttons[0].click()
      console.log('Nhấp vào nút đầu tiên thành công!')
    } else {
      console.log('Không tìm thấy nút nào.')
    }
    await sleep(5000)
    const element = await linkTwitterPage.$('button[data-testid="OAuth_Consent_Button"]')
    if (element) {
      await linkTwitterPage.click('button[data-testid="OAuth_Consent_Button"]')
      console.log('link thành công')
    } else {
      await sleep(1000)
      await linkTwitterPage.click('div[data-testid="google_sign_in_container"]')
      console.log('clicked')
      const newPagePromise = new Promise<Page>((resolve, reject) => {
        const handleTargetCreated = async (target: Target) => {
          try {
            const newPage = await target.page()
            if (newPage) {
              resolve(newPage)
              browser.off('targetcreated', handleTargetCreated)
            }
          } catch (error) {
            reject(error)
          }
        }
        browser.on('targetcreated', handleTargetCreated)
      })

      try {
        const newPage = await newPagePromise
        await sleep(4000)
        const element = await newPage.$('.VV3oRb.YZVTmd')
        if (element) {
          await newPage.click('.VV3oRb.YZVTmd')
          console.log('link thành công!')
        }
      } catch (err) {
        console.log('Đã xảy ra lỗi trong quá trình đăng nhập Twitter')
      }
      await sleep(2000)
      await linkTwitterOnJumptask(browser)
    }
  } catch (error) {
    log('Error in loginTwitterOnJumptask:', error)
    await deleteJumptaskAccount(browser)
    await browser.close()
  }
}

const linkTwitterOnJumptask = async (browser: Browser) => {
  try {
    const linkTwitterPage = await browser.newPage()
    const pages = await browser.pages()
    await linkTwitterPage.goto('https://app.jumptask.io/social-accounts')
    pages.pop()
    for (const page of pages) {
      await page.close()
    }
    await linkTwitterPage.waitForSelector('button[data-testid="link-social"]')
    const buttons = await linkTwitterPage.$$('button[data-testid="link-social"]')
    if (buttons.length > 0) {
      await buttons[0].click()
      console.log('Nhấp vào nút đầu tiên thành công!')
    } else {
      console.log('Không tìm thấy nút nào.')
    }
    await sleep(5000)
    await linkTwitterPage.waitForSelector('button[data-testid="OAuth_Consent_Button"]')
    await linkTwitterPage.click('button[data-testid="OAuth_Consent_Button"]')
    await sleep(5000)
    console.log('link thành công')
  } catch (error) {
    log('Error in linkTwitterOnJumptask:', error)
    await deleteJumptaskAccount(browser)
    await browser.close()
  }
}

export const addIdJumptaskToHoneygain = async (browser: Browser, id: string) => {
  try {
    const honeygainPage = await browser.newPage()
    await honeygainPage.goto('https://dashboard.honeygain.com/')
    await honeygainPage.bringToFront()
    await sleep(5000)
    const addButtonExists = await honeygainPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('span.sc-dlniIP')) as HTMLSpanElement[]
      return buttons.some((button) => button.innerText?.trim() === 'Confirm email')
    })

    if (addButtonExists) {
      const verifyPage = await browser.newPage()
      await verifyPage.goto('https://mail.tm/en/')

      await verifyPage.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('ul li a')) as HTMLElement[]
        if (elements.length > 0) {
          elements[0].click()
        }
      })

      await sleep(3000)
      await verifyPage.waitForSelector('iframe.w-full')

      const iframeElement = await verifyPage.$('iframe.w-full')
      const iframe = await iframeElement?.contentFrame()

      const link = await iframe?.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[]
        return anchors.find((anchor) => anchor.textContent?.includes('Confirm email'))
      })

      if (link) {
        await link.click()
        await sleep(3000)
        await link.click()
      } else {
        log('Không tìm thấy liên kết')
      }
    }
    const element = await honeygainPage.$('div.sc-ciOLHU')
    if (element) {
      await element.click()
    }
    await sleep(3000)
    await honeygainPage.waitForSelector('div.react-toggle-track')
    await honeygainPage.click('div.react-toggle-track')
    await sleep(2000)
    await honeygainPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.sc-gKAaef')) as HTMLButtonElement[]
      const addButton = buttons.find((button) => button.innerText?.trim() === 'Let’s start!')
      if (addButton) {
        addButton.click()
      }
    })
    await sleep(1000)
    await honeygainPage.waitForSelector('input#accountId')
    await honeygainPage.type('input#accountId', id)
    await honeygainPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.sc-gKAaef')) as HTMLButtonElement[]
      const addButton = buttons.find((button) => button.innerText?.trim() === 'Add the account')
      if (addButton) {
        addButton.click()
      }
    })
    await sleep(5000)
    const code = await getCodeMailTemp(browser)
    await honeygainPage.waitForSelector('input#code')
    await honeygainPage.type('input#code', code as string)
    await sleep(1000)
    await honeygainPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.sc-gKAaef')) as HTMLButtonElement[]
      const addButton = buttons.find((button) => button.innerText?.trim() === 'Verify')
      if (addButton) {
        addButton.click()
      }
    })
    await sleep(1000)
    await honeygainPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.sc-gKAaef')) as HTMLButtonElement[]
      const addButton = buttons.find((button) => button.innerText?.trim() === 'Let’s JumpTask!')
      if (addButton) {
        addButton.click()
      }
    })
  } catch (error) {
    log('Error in addIdJumptaskToHoneygain:', error)
    await deleteJumptaskAccount(browser)
    await browser.close()
  }
}

export const getCodeMailTemp = async (browser: Browser) => {
  try {
    const mailTemp = await browser.newPage()
    await mailTemp.goto('https://mail.tm/en/')
    await sleep(3000)
    await mailTemp.waitForSelector('ul li a')
    await mailTemp.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('ul li a')) as HTMLElement[]
      if (elements) {
        const element = elements[0]
        element.click()
      }
    })
    await sleep(3000)
    await mailTemp.waitForSelector('iframe.w-full')
    const iframeElement = await mailTemp.$('iframe.w-full')
    const iframe = await iframeElement?.contentFrame()
    if (iframe) {
      const code = await iframe.evaluate(() => {
        const codeElement = document.querySelector('h2') as HTMLHeadingElement
        return codeElement.innerText
      })
      return code
    } else {
      throw new Error('Could not find the iframe or the code element inside it.')
    }
  } catch (error) {
    log('Error in getCodeMailTemp:', error)
  }
}

export const unlockAchievements = async (browser: Browser) => {
  try {
    const honeygain = await browser.newPage()
    await honeygain.goto('https://dashboard.honeygain.com/achievements')
    await sleep(3000)
    const pages = await browser.pages()
    pages.pop()
    for (const page of pages) {
      await page.close()
    }
    await sleep(2000)
    await honeygain.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.sc-gKAaef')) as HTMLButtonElement[]
      const addButton = buttons.find((button) => button.innerText?.trim() === 'Unlock achievements')
      if (addButton) {
        addButton.click()
      }
    })
    await sleep(3000)
  } catch (error) {
    log('Error in unlockAchievements:', error)
  }
}

export const addMainAccountIdToHoneygain = async (browser: Browser, id: string, step?: number) => {
  try {
    const honeygain = await browser.newPage()
    await honeygain.goto('https://dashboard.honeygain.com/profile')
    const pages = await browser.pages()
    pages.pop()
    for (const page of pages) {
      await page.close()
    }
    await sleep(3000)
    await honeygain.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('span')) as HTMLSpanElement[]
      const addButton = buttons.find((button) => button.innerText?.trim() === 'Change')
      if (addButton) {
        addButton.click()
      }
    })
    await sleep(2000)
    await honeygain.waitForSelector('input#accountId')
    await honeygain.focus('input#accountId')
    await honeygain.keyboard.down('Control')
    await honeygain.keyboard.press('A')
    await honeygain.keyboard.up('Control')
    await honeygain.keyboard.press('Backspace')
    await honeygain.type('input#accountId', id)
    await honeygain.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.sc-gKAaef')) as HTMLButtonElement[]
      const addButton = buttons.find((button) => button.innerText?.trim() === 'Add the account')
      if (addButton) {
        addButton.click()
      }
    })
    if (step === 2) {
      logoutHoneygain(honeygain)
    }
  } catch (error) {
    log('Error in addMainAccountIdToHoneygain:', error)
  }
}

export const rewardAchievements = async (browser: Browser) => {
  try {
    const honeygain = await browser.newPage()
    await honeygain.goto('https://dashboard.honeygain.com/achievements')
    await sleep(2000)
    await honeygain.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
      const claimRewards = buttons.filter((button) => button.innerText?.trim() === 'Claim reward')
      claimRewards.forEach((button) => {
        button.click()
      })
    })
    await sleep(6000)
    console.log('Claim rewards thành công')
  } catch (error) {
    console.log('Error in rewardAchievements:', error)
  }
}

export const addPhuAccountToHoneygain = async (browser: Browser, id: string) => {
  try {
    await addMainAccountIdToHoneygain(browser, id, 2)
    await sleep(2000)
  } catch (error) {
    console.log('Error in addPhuAccountToHoneygain:', error)
  }
}

export const logoutMailTemp = async (mailTemp: Page) => {
  try {
    await sleep(3000)
    await mailTemp.waitForSelector('button[aria-label="Sign out"]')
    const buttons = await mailTemp.$$('button[aria-label="Sign out"]')
    if (buttons.length > 0) {
      await buttons[1].click()
    }
    await sleep(8000)
    await mailTemp.reload()
  } catch (error) {
    log('Error in logoutMailTemp:', error)
  }
}

export const logoutHoneygain = async (honeygain: Page) => {
  try {
    await sleep(3000)
    await honeygain.click('div.sc-ciOLHU')
    await sleep(1000)
    await honeygain.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[]
      const addButton = buttons.find((button) => button.innerText?.trim() === 'Log out')
      if (addButton) {
        addButton.click()
      }
    })
  } catch (error) {
    log('Error in logoutHoneygain:', error)
  }
}
