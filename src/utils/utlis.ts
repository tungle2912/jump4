import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { Browser, Page, Target } from 'puppeteer'
import { sleep } from '~/lib/utils'
import { filterActiveProxies, proxiesOther } from '~/services/proxy'

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
    if (element) {
      await jumptask.click('button[type="button"]>p.MuiTypography-body1')
    }
    console.log('click login with google successfully')
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
    let newPageReady = await isPageReady(newPage)
    let retries = 0
    const maxRetries = 3
    while (!newPageReady && retries < maxRetries) {
      console.log('Trang mới chưa tải xong, tải lại...')
      await newPage.reload()
      await sleep(3000)
      newPageReady = await isPageReady(newPage)
      retries++
    }

    if (!newPageReady) {
      console.log('Trang mới vẫn chưa sẵn sàng sau các lần thử')
      return
    }
    await newPage.waitForSelector('.yAlK0b')
    const element1 = await newPage.$('.yAlK0b')
    if (element1) {
      await newPage.click('.yAlK0b')
    }
    await new Promise<void>((resolve) => {
      newPage.once('close', () => {
        console.log('Trang mới đã đóng')
        resolve()
      })
    })
    console.log('link thành công')
    // await newPage.evaluate(() => {
    //   const element = document.querySelector('.yAlK0b') as HTMLElement | null
    //   if (element) {
    //     element.click()
    //   }
    // })
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
    console.error('Failed to check Twitter link:', error)
  }
}
export const enterBonusCodeJumptask = async (accessToken: string) => {
  try {
    await axios.post(
      'https://api.jumptask.io/referral/coupons/vovocegidada/users',
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
export const loginTwitterOnJumptask = async (browser: Browser) => {
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
    const element = await linkTwitterPage.$('button[data-testid="OAuth_Consent_Button"]')
    if (element) {
      await linkTwitterPage.click('button[data-testid="OAuth_Consent_Button"]')
      console.log('link thành công')
    } else {
      await sleep(1000)
      await linkTwitterPage.waitForSelector('div[data-testid="google_sign_in_container"]')
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
        let newPageReady = await isPageReady(newPage)
        let retries = 0
        const maxRetries = 3
        while (!newPageReady && retries < maxRetries) {
          console.log('Trang mới chưa tải xong, tải lại...')
          await newPage.reload()
          await sleep(3000)
          newPageReady = await isPageReady(newPage)
          retries++
        }

        if (!newPageReady) {
          console.log('Trang mới vẫn chưa sẵn sàng sau các lần thử')
          return
        }
        await newPage.waitForSelector('.yAlK0b')
        const element1 = await newPage.$('.yAlK0b')
        if (element1) {
          await newPage.click('.yAlK0b')
        }
        await new Promise<void>((resolve) => {
          newPage.once('close', () => {
            console.log('Trang mới đã đóng')
            resolve()
          })
        })
        console.log('link thành công')
      } catch (err) {
        console.log('Đã xảy ra lỗi trong quá trình đăng nhập Twitter')
      }
      await sleep(2000)
      await linkTwitterOnJumptask(browser)
    }
  } catch (error) {
    console.log('Error in loginTwitterOnJumptask:', error)
  }
}
export const linkTwitterOnJumptask = async (browser: Browser) => {
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
          (offer: any) =>
            offer.title.toLowerCase().includes('follow') ||
            offer.title.toLowerCase().includes('like') ||
            offer.title.toLowerCase().includes('repost')
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
export async function getCodeEmail(token: string): Promise<string | null> {
  const subjectToFind = 'Verification Code 🔑 | Honeygain'
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const emails = await getEmails(token)

    if (emails && emails.length > 0) {
      const emailToVerify = await findEmailBySubject(emails, subjectToFind)

      if (emailToVerify) {
        console.log(`Found email with subject "${subjectToFind}".`)
        const emailId = emailToVerify.id

        const otp = await getOTPFromEmailDetails(token, emailId)
        if (otp) {
          console.log('OTP:', otp)
          return otp
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
export async function addIdJump(accessToken: string, jtKey: string, confirmEmailLink?: string) {
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
    const errorResponse = error.response ? error.response.data : null

    if (errorResponse && errorResponse.type === 403 && errorResponse.title === 'user_email_not_confirmed') {
      console.log('User email not confirmed. Retrying...')
      await confirm(confirmEmailLink)
      await sleep(3000)
      try {
        // Re-attempt the API call after handling the issue (e.g., waiting for email confirmation)
        const retryResponse = await axios.patch('https://dashboard.honeygain.com/api/v2/settings/jt', body, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        console.log('Retry success: add Id Jump:', retryResponse.data)
      } catch (retryError: any) {
        console.error('Error during retry:', retryError.response ? retryError.response.data : retryError.message)
      }
    } else {
      console.error('Error calling JT Toggle API:', errorResponse.title ? errorResponse : error.message)
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
export async function unlockAchievementsHoneygain(accessToken: string) {
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
      return
    } catch (error: any) {
      attempts++
      console.error(
        `Attempt ${attempts} failed. Error following X Jump task:`,
        error.response ? error.response.data : error.message
      )
      if (attempts < maxRetries) {
        console.log('Retrying in 3 seconds...')
        await sleep(3000)
      } else {
        console.error('Max retries reached. Aborting follow.')
        break
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
        console.log('Retrying in 2 seconds...')
        await sleep(3000)
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
    while (!success && activeProxies.length > 0) {
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
