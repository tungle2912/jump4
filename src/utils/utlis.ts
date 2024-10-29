import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { Browser, Page, Target } from 'puppeteer'
import { sleep } from '~/lib/utils'
import { filterActiveProxies, proxiesOther } from '~/services/proxy'
import { promises as fs } from 'fs'
import { addProxyToProfile } from '~/api/gologin'
import emulatorController from '~/controllers/emulator.controllers'
import adb from '~/services/appium-adb'
import envVariables from '~/constants/env-variables'
export const isPageReady = async (page: Page): Promise<boolean> => {
  try {
    // Kiểm tra trạng thái của trang
    const readyState = await page.evaluate(() => {
      const state = document.readyState
      return state === 'complete' || state === 'interactive' // Cả 2 trạng thái đều có thể được coi là đã tải
    })

    // Đảm bảo không có lỗi JavaScript nào cản trở việc tải trang
    const hasErrors = await page.evaluate(() => {
      const logs = window.console ? window.console.error : null
      return logs ? logs.length > 0 : false
    })

    // Trả về true nếu trang đã hoàn tất và không có lỗi
    return readyState && !hasErrors
  } catch (err) {
    console.log('Error checking if page is ready: ', err)
    return false // Trả về false nếu có lỗi
  }
}

export const clickWithRetry = async (page: Page, selector: string, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await page.waitForSelector(selector)
      await page.click(selector)
      return
    } catch (err) {
      if (attempt === retries) throw err
      console.log(`Thử lại click vào ${selector}, lần thứ ${attempt}`)
    }
  }
}

export const loginJumptask = async (browser: Browser, jumptask: Page) => {
  try {
    await sleep(5000)
    await jumptask.waitForSelector('button[type="button"]>p.MuiTypography-body1', { timeout: 60000 })
    const element = await jumptask.$('button[type="button"]>p.MuiTypography-body1')
    if (!element) {
      throw new Error('Login button not found')
    }

    const maxRetries = 3
    let retries = 0
    let newPage: Page | null = null

    // Retry logic for clicking and waiting for the new tab to open
    while (retries < maxRetries && !newPage) {
      console.log(`Attempting to click login button... try ${retries + 1}`)
      // Listen for new tab (target created)
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

      // Click the button
      await element.click()
      console.log('Login button clicked, waiting for new tab...')
      try {
        // Wait for the new tab (max 10 seconds)
        newPage = await Promise.race([newPagePromise, sleep(10000).then(() => null)])
        if (newPage) {
          console.log('New tab detected, proceeding with login.')
        } else {
          throw new Error('New tab did not open after clicking the login button.')
        }
      } catch (err: any) {
        console.log(`Error: ${err.message}. Retrying...`)
        retries++
      }
    }

    if (!newPage) {
      console.log('Failed to open new tab after multiple attempts.')
      return false
    }
    await newPage.bringToFront()
    // Check if the new page is ready
    // let newPageReady = await isPageReady(newPage)
    // retries = 0
    // while (!newPageReady && retries < maxRetries) {
    //   console.log('New tab not ready yet, reloading...')
    //   await newPage.reload()
    //   await sleep(3000)
    //   newPageReady = await isPageReady(newPage)
    //   retries++
    // }

    // if (!newPageReady) {
    //   console.log('New tab still not ready after retries')
    //   return
    // }

    // Continue with the login process in the new tab
    await newPage.waitForSelector('.yAlK0b')
    let element1 = await newPage.$('.yAlK0b')

    const maxRetries2 = 3
    let retries2 = 0
    let tabClosed = false

    while (!tabClosed && retries2 < maxRetries2) {
      if (element1) {
        await newPage.click('.yAlK0b')
      }

      // Wait for the tab to close within 5 seconds
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          resolve() // Resolve the promise after 5 seconds
        }, 5000)

        newPage.once('close', () => {
          clearTimeout(timeout) // Clear timeout if tab is closed
          console.log('New tab closed successfully')
          tabClosed = true // Mark tab as closed
          resolve() // Resolve the promise as the tab closed
        })
      })

      if (!tabClosed) {
        retries2++
        element1 = await newPage.$('.yAlK0b')
      }
    }
    if (tabClosed) {
      console.log('Login successful!')
      return true
    } else {
      console.log('Tab did not close after retries')
      return false
    }
  } catch (err: any) {
    console.log('An error occurred during the Jumptask login process')
    console.log(err?.message)
    return false
  }
}

export async function getIdJump(accessToken: string) {
  try {
    const [header, payload] = accessToken.split('.')
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    return decodedPayload.sub
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}
export const checkLinkTwitter = async (accessToken: string, userId: string) => {
  try {
    const response = await axios.get(`https://api.jumptask.io/auth/networks?networks%5B%5D=x&user_id=${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    console.log('link twitter response:', response.data.data)
    const twitterAccounts = response.data.data
    return twitterAccounts != null && twitterAccounts.length > 0
  } catch (error) {
    console.error('Failed to check Twitter link:')
  }
}
export const enterBonusCodeJumptask = async (accessToken: string) => {
  try {
    const code = envVariables.REFERRAL_CODE
    await axios.post(
      `https://api.jumptask.io/referral/coupons/${code}/users `,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )
  } catch (error) {
    console.error('Failed to enter bonus code:')
  }
}
export const loginTwitterOnJumptask = async (browser: Browser, profileId: string, proxy: any): Promise<boolean> => {
  const maxRetries = 3
  let retries = 0

  while (retries < maxRetries) {
    try {
      const linkTwitterPage = await browser.newPage()
      await linkTwitterPage.goto('https://app.jumptask.io/social-accounts')
      await linkTwitterPage.waitForSelector('button[data-testid="link-social"]', { timeout: 60000 })
      const checkCircleIcon = await linkTwitterPage.$('svg[data-testid="CheckCircleIcon"]')
      if (checkCircleIcon) {
        console.log('Đã tìm thấy biểu tượng CheckCircleIcon. Không thực hiện thêm hành động nào.')
        return true // Thành công, kết thúc hàm với giá trị true
      }
      const buttons = await linkTwitterPage.$$('button[data-testid="link-social"]')
      if (buttons.length > 0) {
        await buttons[0].click()
        console.log('Nhấp vào nút đầu tiên thành công!')
      } else {
        console.log('Không tìm thấy nút nào.')
      }
      await sleep(5000)
      const firstElement = await Promise.race([
        linkTwitterPage.waitForSelector('button[data-testid="OAuth_Consent_Button"]', { timeout: 50000 }),
        linkTwitterPage.waitForSelector('div[data-testid="google_sign_in_container"]', { timeout: 50000 })
      ])

      if (firstElement) {
        await firstElement.click()
        console.log('Thực hiện nhấp vào phần tử đầu tiên xuất hiện thành công!')

        if (
          await (firstElement as any).evaluate((el: any) => el.getAttribute('data-testid') === 'OAuth_Consent_Button')
        ) {
          console.log('Link thành công qua OAuth!')
          return true
        }

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

        const newPage = await newPagePromise
        await newPage.bringToFront()
        await newPage.waitForSelector('.yAlK0b')

        let element1 = await newPage.$('.yAlK0b')
        const maxRetries2 = 3
        let retries2 = 0
        let tabClosed = false

        while (!tabClosed && retries2 < maxRetries2) {
          if (element1) {
            await newPage.click('.yAlK0b')
          }

          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 5000)
            newPage.once('close', () => {
              clearTimeout(timeout)
              console.log('New tab closed successfully')
              tabClosed = true
              resolve()
            })
          })

          if (!tabClosed) {
            retries2++
            element1 = await newPage.$('.yAlK0b')
          }
        }
        console.log('Login successful!')

        await linkTwitterOnJumptask(browser)
      } else {
        console.log('Không tìm thấy cả hai phần tử cần thiết để đăng nhập.')
      }
    } catch (error) {
      retries++
      if (retries >= maxRetries) {
        console.log(`Đã xảy ra lỗi trong quá trình đăng nhập Twitter sau ${maxRetries} lần thử.`, error)
        await addProxyToProfile({
          profileId: profileId,
          proxy: proxy
        })
        console.log('Proxy set successfully for profile:')
        return false // Trả về false khi hết số lần thử
      }
      console.log(`Thử lại đăng nhập Twitter lần thứ ${retries + 1}...`)
      await sleep(5000)
    }
  }

  return false // Nếu thoát khỏi vòng lặp mà không thành công
}
export const linkTwitterOnJumptask = async (browser: Browser) => {
  try {
    const linkTwitterPage = await browser.newPage()
    await linkTwitterPage.goto('https://app.jumptask.io/social-accounts')
    //  await sleep(5000)
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
    //  await sleep(10000)
    await linkTwitterPage.waitForSelector('button[data-testid="OAuth_Consent_Button"]')
    await linkTwitterPage.$('button[data-testid="OAuth_Consent_Button"]')
    await linkTwitterPage.click('button[data-testid="OAuth_Consent_Button"]')
    console.log('link thành công')
    await sleep(5000)
  } catch (error) {
    console.log('Error in linkTwitterOnJumptask:', error)
  }
}
export async function getAchievementIdsForJumpTask(
  accesstoken: string,
  retries = 3
): Promise<{ jumpTaskGainerId: string | null; jumpTaskProId: string | null } | null> {
  try {
    const response = await axios.get('https://dashboard.honeygain.com/api/v1/achievements', {
      headers: {
        Authorization: `Bearer ${accesstoken}`
      }
    })
    const achievements = response.data.data
    const jumpTaskGainer = achievements.find((item: any) => item.title === 'JumpTask Gainer')
    const jumpTaskPro = achievements.find((item: any) => item.title === 'JumpTask Pro')
    const jumpTaskGainerId = jumpTaskGainer ? jumpTaskGainer.id : null
    const jumpTaskProId = jumpTaskPro ? jumpTaskPro.id : null

    if (!jumpTaskGainerId && !jumpTaskProId) {
      throw new Error('Không tìm thấy achievement với các title này')
    }

    return { jumpTaskGainerId, jumpTaskProId }
  } catch (error: any) {
    console.error('Có lỗi xảy ra:', error.message)

    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`)
      return getAchievementIdsForJumpTask(accesstoken, retries - 1)
    } else {
      console.error('Hết số lần thử lại')
      return null
    }
  }
}
export async function getAllPostFollowId(accessToken: string): Promise<string[]> {
  const url = 'https://api.jumptask.io/offerwall/offers?tags%5B%5D=social'
  const maxRetries = 3 // Set the number of retry attempts

  const fetchOffers = async (retryCount = maxRetries): Promise<string[]> => {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      const filteredOffers = response.data.data.offers
        .filter(
          (offer: any) => offer.title.toLowerCase().includes('follow') || offer.title.toLowerCase().includes('like')
        )
        .map((offer: any) => offer.offer_id)

      return filteredOffers
    } catch (error) {
      console.error('Error fetching offers:', error)

      if (retryCount > 0) {
        console.log(`Retrying... (${retryCount} attempts left)`)
        return fetchOffers(retryCount - 1) // Retry the request
      } else {
        console.error('All retry attempts failed.')
        return []
      }
    }
  }

  return fetchOffers() // Call the function with the default retry count
}
export async function getEmailDetailsAndFirstHref(token: string, emailId: string) {
  try {
    const response = await axios.get(`https://api.mail.tm/messages/${emailId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const emailBody = response.data.text

    if (!emailBody) {
      console.error('Email body is undefined.')
      return null
    }

    const hrefMatch = emailBody.match(/Confirm email\s*\( (https?:\/\/[^\s]+) \)/i)

    if (hrefMatch && hrefMatch[1]) {
      const firstHref = hrefMatch[1]
      return firstHref
    } else {
      console.log('No link found.')
      return null
    }
  } catch (error: any) {
    console.error('Error fetching email details:', error.response ? error.response.data : error.message)
  }
}
export async function getOTPFromEmailDetails(token: string, emailId: string) {
  try {
    const response = await axios.get(`https://api.mail.tm/messages/${emailId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const emailDetails = response.data.text
    if (!emailDetails) {
      console.error('Email body is undefined.')
      return null
    }

    const codeMatch = emailDetails.match(/(\d{6})/)

    if (codeMatch && codeMatch[1]) {
      const verificationCode = codeMatch[1]
      return verificationCode // Return the found code
    } else {
      console.log('No verification code found.')
      return null
    }
  } catch (error: any) {
    console.error('Error fetching email details:', error.response ? error.response.data : error.message)
  }
}
export async function getEmails(token: string) {
  try {
    const response = await axios.get('https://api.mail.tm/messages', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const emails = response.data['hydra:member']
    return emails
  } catch (error: any) {
    console.error('Error fetching emails:', error.response ? error.response.data : error.message)
  }
}
export async function findEmailBySubject(emails: any, subjectToFind: any) {
  return emails.find((email: any) => email.subject === subjectToFind)
}
export async function findEmailByVerificationCodeSubject(emails: any, subjectToFind: any) {
  return emails.find((email: any) => email.subject === subjectToFind)
}
export async function createRandomEmail(maxRetries: number = 3) {
  let retryCount = 0
  const password = 'Tungle'

  while (retryCount < maxRetries) {
    try {
      const response = await axios.get('https://api.mail.tm/domains')
      const domain = response.data['hydra:member'][0].domain // Get the first available domain
      const randomEmail = `${Math.random().toString(36).substring(7)}@${domain}`

      // Create the account with the random email
      await axios.post('https://api.mail.tm/accounts', {
        address: randomEmail,
        password: password
      })

      console.log(`Email created: ${randomEmail}`)
      return { email: randomEmail, password }
    } catch (error: any) {
      retryCount++
      console.error(`Error creating email (Attempt ${retryCount}/${maxRetries}):`, error.message)
      if (retryCount >= maxRetries) {
        throw new Error('Max retry attempts reached. Unable to create random email.')
      }
    }
  }
}
export async function loginMail(email: string, password: string) {
  try {
    const response = await axios.post('https://api.mail.tm/token', {
      address: email,
      password: password
    })
    const token = response.data.token
    console.log('Token received:', token)
    return token
  } catch (error: any) {
    console.error('Error logging in:', error.response ? error.response.data : error.message)
  }
}
export async function verifyEmail(token: string) {
  const subjectToFind = 'Verify your email address 📬'
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const emails = await getEmails(token)

    if (emails && emails.length > 0) {
      const emailToVerify = await findEmailBySubject(emails, subjectToFind)

      if (emailToVerify) {
        console.log(`Found email with subject "${subjectToFind}".`)
        const emailId = emailToVerify.id

        const firstHref = await getEmailDetailsAndFirstHref(token, emailId)
        if (firstHref) {
          return firstHref
        }
      } else {
        console.log(`No email with subject "${subjectToFind}" found yet, retrying...`)
      }
    } else {
      console.log('No emails received yet, retrying...')
    }
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
}
export async function getCodeEmail(
  token: string,
  accessTokenHoneygain: string,
  idJump: string
): Promise<string | null> {
  const subjectToFind = 'Verification Code 🔑 | Honeygain'
  await sleep(3000)
  let count = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const emails = await getEmails(token)

    if (emails && emails.length > 0) {
      const emailToVerify = await findEmailBySubject(emails, subjectToFind)
      if (count == 10) {
        await addFirstIdJump(accessTokenHoneygain, idJump)
      }
      if (emailToVerify) {
        console.log(`Found email with subject "${subjectToFind}".`)
        const emailId = emailToVerify.id
        const otp = await getOTPFromEmailDetails(token, emailId)
        if (otp) {
          console.log('OTP:', otp)
          return otp
        }
      } else {
        count++
        console.log(`No email with subject "${subjectToFind}" found yet, retrying...`)
      }
    } else {
      console.log('No emails received yet, retrying...')
    }

    await sleep(5000)
  }
}
export async function registerHoneygain(email: string, axiosInstance: any): Promise<string | null> {
  const url = 'https://dashboard.honeygain.com/api/v1/users'
  const body = {
    email: email,
    password: email // Assuming the password is the same as the email
  }

  let success = false
  let accessToken: string | null = null

  try {
    // First attempt to register the user
    const response = await axiosInstance.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0'
      }
    })

    accessToken = response.data.data.access_token
    console.log('User created successfully:', accessToken)
    success = true // Mark success if the request was successful
  } catch (error: any) {
    console.error('Error creating user:', error.response ? error.response.data : error.message)

    // Fetch the list of available proxies
    let activeProxies = await filterActiveProxies(proxiesOther)

    // Retry with proxies if the first attempt failed
    while (!success && activeProxies.length > 0) {
      const currentProxy = activeProxies[Math.floor(Math.random() * activeProxies.length)] // Select a random proxy
      console.log(`Switching to a new proxy: ${currentProxy.host}`)

      const agent = new HttpsProxyAgent(
        `http://${currentProxy.username}:${currentProxy.password}@${currentProxy.host}:${currentProxy.port}`
      )
      // Create a new axios instance using the selected proxy
      axiosInstance = axios.create({
        httpAgent: agent,
        httpsAgent: agent
      })
      try {
        // Retry the registration with the new proxy
        const retryResponse = await axiosInstance.post(url, body, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0'
          }
        })
        accessToken = retryResponse.data.data.access_token
        console.log('User created successfully with new proxy:', accessToken)
        success = true // Mark success if the retry was successful
      } catch (retryError: any) {
        console.error(
          `Error creating user with proxy ${currentProxy.host}:`,
          retryError.response ? retryError.response.data : retryError.message
        )
        // Remove the failed proxy from the list
        activeProxies = activeProxies.filter((proxy) => proxy.host !== currentProxy.host)
      }
    }
  }
  if (!success) {
    console.error('Failed to create the user after trying all available proxies.')
  }

  return accessToken // Return the access token if successful, otherwise null
}
export async function addFirstIdJump(accessToken: string, jtKey: string) {
  const body = {
    jt_toggle: true,
    jt_key: jtKey,
    wallet: 'account_id'
  }
  try {
    const response = await axios.patch('https://dashboard.honeygain.com/api/v2/settings/jt', body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    console.log('add Id Jump:', response.data)
  } catch (error: any) {
    console.error('Error add id jump:', error.response.data)
  }
}
export async function addIdJump(accessToken: string, jtKey: string, confirmEmailLink?: string) {
  const body = {
    jt_toggle: true,
    jt_key: jtKey,
    wallet: 'account_id'
  }
  let retryCount = 0
  const maxRetries = 3
  while (retryCount < maxRetries) {
    try {
      const response = await axios.patch('https://dashboard.honeygain.com/api/v2/settings/jt', body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      console.log('add Id Jump:', response.data)
      return
    } catch (error: any) {
      retryCount++
      console.error(`Error add id (Attempt ${retryCount}/${maxRetries}):`, error.response.data)
      await sleep(3000)
      // Nếu đạt số lần thử tối đa, báo lỗi và dừng lại
      if (retryCount >= maxRetries) {
        throw new Error('Max retry attempts reached. Unable to confirm user registration.')
      }
    }
  }
}
export async function confirmWithOTP(accessToken: string, otp: string) {
  try {
    const body = {
      code: otp
    }
    const response = await axios.patch('https://dashboard.honeygain.com/api/v1/user_confirmations', body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    console.log('User confirmed with OTP:', response.data)
  } catch (error: any) {
    console.error('Error confirming user with OTP:', error.response ? error.response.data : error.message)
  }
}
export async function fetchNewAccessToken(email: string) {
  try {
    const body = {
      email: email,
      password: email
    }
    const response = await axios.post('https://dashboard.honeygain.com/api/v1/users/tokens', body, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    console.log('New access token fetched:', response.data.data.access_token)
    return response.data.data.access_token
  } catch (error: any) {
    console.error('Error fetching new access token:', error.response ? error.response.data : error.message)
    return null
  }
}
export async function unlockAchievementsHoneygain(accessToken: string, email: string) {
  const maxRetries = 3
  let attempts = 0

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  while (attempts < maxRetries) {
    try {
      const response = await axios.post(
        'https://dashboard.honeygain.com/api/v1/achievements/unlock',
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('Achievements unlocked:', response.data)
      return
    } catch (error: any) {
      attempts++
      console.error(
        `Attempt ${attempts} failed. Error unlocking achievements:`,
        error.response ? error.response.data : error.message
      )
      if (attempts == 2) {
        await emulatorController.resetLoginHoneygain({
          deviceId: await adb.getDeviceId(),
          email: email || ''
        })
      }
      if (attempts < maxRetries) {
        console.log('Retrying in 2 seconds...')
        await sleep(2000)
      } else {
        console.error('Max retries reached. Aborting unlock.')
      }
    }
  }
}
export async function confirmUserRegistration(accessToken: string, maxRetries: number = 3) {
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      const response = await axios.post(
        'https://dashboard.honeygain.com/api/v1/users/confirmation_tokens',
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      console.log('User confirmation triggered:', response.data)
      return response.data // Trả về kết quả nếu thành công
    } catch (error: any) {
      retryCount++
      console.error(
        `Error confirming user (Attempt ${retryCount}/${maxRetries}):`,
        error.response ? error.response.data : error.message
      )
      await sleep(3000)
      // Nếu đạt số lần thử tối đa, báo lỗi và dừng lại
      if (retryCount >= maxRetries) {
        throw new Error('Max retry attempts reached. Unable to confirm user registration.')
      }
    }
  }
}
export async function followXJumptask(accessToken: string, userId: string, postId: string) {
  const maxRetries = 5
  let attempts = 0
  while (attempts < maxRetries) {
    try {
      const body = {
        user_id: userId
      }
      const urlApi = `https://api.jumptask.io/marketplace/offers/${postId}/flows`
      const response = await axios.post(urlApi, body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      console.log('Follow X Jump task:', response.data)
      await sleep(1000)
      return true
    } catch (error: any) {
      attempts++
      console.error(
        `Attempt ${attempts} failed. Error following X Jump task:`,
        error.response ? error.response.data : error.message
      )
      if (attempts < maxRetries) {
        console.log('Retrying in 4 seconds...')
        await sleep(4000)
      } else {
        console.error('Max retries reached. Aborting follow.')
        return false
      }
    }
  }
}
export async function claimRewardsHoneygain(accessToken: string, id: string) {
  const maxRetries = 6
  let attempts = 0

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  while (attempts < maxRetries) {
    try {
      const body = {
        user_achievement_id: id
      }

      const response = await axios.post('https://dashboard.honeygain.com/api/v1/achievements/claim', body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Rewards claimed:', response.data)
      return response.data.code
    } catch (error: any) {
      attempts++
      console.error(
        `Attempt ${attempts} failed. Error claiming rewards:`,
        error.response ? error.response.data : error.message
      )

      if (attempts < maxRetries) {
        console.log('Retrying in 5 seconds...')
        await sleep(5000)
      } else {
        console.error('Max retries reached. Aborting claim.')
        return error.response.data.code
      }
    }
  }
}
export async function deleteAccountJumps(accessToken: string, id: string, axiosInstance: any) {
  let success = false
  try {
    const urlApi = `https://api.jumptask.io/auth/users/${id}`
    const response = await axiosInstance.delete(urlApi, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    console.log('Account deleted successfully', response.data)
    success = true
  } catch (error: any) {
    console.error('Error deleting account:', error.response ? error.response.data : error.message)
    let activeProxies = await filterActiveProxies(proxiesOther)
    let countRetry = 0
    const maxRetries = 7
    while (!success && countRetry < maxRetries) {
      countRetry++
      const currentProxy = activeProxies[Math.floor(Math.random() * activeProxies.length)] // Chọn proxy ngẫu nhiên
      console.log(`Switching to a new proxy: ${currentProxy.host}`)
      const agent = new HttpsProxyAgent(
        `http://${currentProxy.username}:${currentProxy.password}@${currentProxy.host}:${currentProxy.port}`
      )
      // Tạo axios instance mới với proxy mới
      axiosInstance = axios.create({
        httpAgent: agent,
        httpsAgent: agent
      })
      try {
        // Thử lại API call với proxy mới
        const urlApi = `https://api.jumptask.io/auth/users/${id}`
        const response = await axiosInstance.delete(urlApi, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        console.log('Account deleted successfully with new proxy:', currentProxy.host)
        success = true // Nếu thành công, thoát khỏi vòng lặp
      } catch (retryError: any) {
        console.error(
          `Error deleting account with proxy ${currentProxy.host}:`,
          retryError.response ? retryError.response.data : retryError.message
        )
        // Nếu không thành công, loại bỏ proxy đã thử và chọn proxy khác
        activeProxies = activeProxies.filter((proxy) => proxy.host !== currentProxy.host)
      }
    }
  }

  if (!success) {
    console.error('Failed to delete the account after trying available proxies.')
  }
}
// Hàm đọc dữ liệu từ file
export async function readFromFile(filePath: string): Promise<number | null> {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return +data
  } catch (error) {
    console.error('Lỗi khi đọc file:', error)
    return null
  }
}
export async function writeToFile(filePath: string, data: number) {
  try {
    await fs.writeFile(filePath, data.toString(), 'utf-8')
  } catch (error) {
    console.error('Lỗi khi ghi file:', error)
  }
}
export async function appendToFile(filePath: string, data: number) {
  try {
    await fs.appendFile(filePath, data.toString() + '\n', 'utf-8')
  } catch (error) {
    console.error('Lỗi khi ghi file:', error)
  }
}
export async function getCoin(filePath: string): Promise<number> {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    const lines = data.trim().split('\n')
    const lastLine = lines[lines.length - 1]
    const number = Number(lastLine)

    if (isNaN(number)) {
      throw new Error('Dòng cuối không phải là một số hợp lệ')
    }

    return number
  } catch (error: any) {
    console.error('Lỗi khi đọc file:', error.message)
    throw error
  }
}
