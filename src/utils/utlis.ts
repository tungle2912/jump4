import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { Browser, Page, Target } from 'puppeteer'
import { sleep } from '~/lib/utils'
import { filterActiveProxies, proxiesOther } from '~/services/proxy'
export const isPageReady = async (page: Page) => {
  return page.evaluate(() => document.readyState === 'complete')
}
export const clickWithRetry = async (page: Page, selector: string, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await page.waitForSelector(selector, { visible: true, timeout: 60000 })
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
    let element = null
    let attempts = 0
    const maxAttempts = 3 // Số lần tối đa để thử lại
    while (attempts < maxAttempts) {
      try {
        const pageReady = await isPageReady(jumptask)
        if (!pageReady) {
          console.log('Trang chưa tải xong, thử lại sau...')
          await sleep(3000)
          continue
        }
        await jumptask.waitForSelector('button[type="button"]>p.MuiTypography-body1')
        element = await jumptask.$('button[type="button"]>p.MuiTypography-body1')
        if (element) {
          break
        }
      } catch (err) {
        console.log('Không tìm thấy phần tử, thử tải lại trang...')
        await jumptask.reload()
        await sleep(3000)
      }
      attempts++
    }
    if (!element) {
      console.log('Không tìm thấy phần tử sau các lần thử')
      return
    }
    await jumptask.click('button[type="button"]>p.MuiTypography-body1')
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
    await sleep(8000)
    let newPageReady = await isPageReady(newPage)
    while (!newPageReady) {
      console.log('Trang mới chưa tải xong, thử lại...')
      await sleep(3000)
      newPageReady = await isPageReady(newPage)
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
export const enterBonusCodeJumptask = async (accessToken: string, axios: any) => {
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
        await sleep(5000)
        await newPage.waitForSelector('.VV3oRb.YZVTmd', { visible: true })
        await newPage.click('.VV3oRb.YZVTmd')
        await sleep(2000)
        // } else {
        //   const profile = profiles.find((p) => p.name === profileName)
        //   if (!profile) {
        //     console.log(`Profile with name ${profileName} not found`)
        //     return
        //   }
        //   await newPage.waitForSelector('#identifierId', { visible: true, timeout: 60000 })
        //   await sleep(1000)
        //   await newPage.type('#identifierId', profile.email, { delay: 10 })
        //   await newPage.click('#identifierNext')
        //   await newPage.waitForSelector('input[name="Passwd"]', { visible: true, timeout: 60000 })
        //   await newPage.type('input[name="Passwd"]', profile.password, { delay: 10 })
        //   await newPage.keyboard.press('Enter')
        // }
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
export async function getEmails(login: any, domain: any, axios: any) {
  try {
    const response = await axios.get(
      `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`
    )
    const emails = response.data
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
export async function getAchievementIdsForJumpTask(accesstoken: string, axios: any) {
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
    return null
  }
}
export async function getAllPostFollowId(accessToken: string, axios: any) {
  const url = 'https://api.jumptask.io/offerwall/offers?tags%5B%5D=social'
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    const filteredOffers = response.data.data.offers
      .filter((offer: any) => offer.title.toLowerCase().includes('follow'))
      .map((offer: any) => offer.offer_id)
    return filteredOffers
  } catch (error) {
    console.error('Error fetching offers:', error)
    return []
  }
}
export async function getEmailDetailsAndFirstHref(login: any, domain: any, emailId: any, axios: any) {
  try {
    const response = await axios.get(
      `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${emailId}`
    )
    const emailDetails = response.data

    // Kiểm tra nếu body tồn tại
    if (!emailDetails.body) {
      console.error('Email body is undefined.')
      return null
    }

    const htmlBody = emailDetails.body

    // Sử dụng Regular Expression để tìm href đầu tiên
    const hrefMatch = htmlBody.match(/href="([^"]+)"/)

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
export async function callLink(url: string) {
  try {
    await fetch(url)
    console.log('Link accessed successfully:')
  } catch (error: any) {
    console.error('Error accessing link:', error.response ? error.response.data : error.message)
  }
}
export async function getOTPFromEmailDetails(login: any, domain: any, emailId: any, axios: any) {
  try {
    const response = await axios.get(
      `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${emailId}`
    )
    const emailDetails = response.data

    // Kiểm tra nếu body tồn tại
    if (!emailDetails.body) {
      console.error('Email body is undefined.')
      return null
    }

    const htmlBody = emailDetails.body

    // Sử dụng Regular Expression để tìm mã OTP (6 chữ số)
    const otpMatch = htmlBody.match(/<h2[^>]*>(\d{6})<\/h2>/)

    if (otpMatch && otpMatch[1]) {
      const otp = otpMatch[1]
      return otp
    } else {
      console.log('No OTP found.')
      return null
    }
  } catch (error: any) {
    console.error('Error fetching email details:', error.response ? error.response.data : error.message)
  }
}
export async function createRandomEmail(axios: any) {
  try {
    const response = await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1')
    const email = response.data[0]
    console.log(`Email created: ${email}`)
    return email
  } catch (error: any) {
    console.error('Error creating email:', error.response ? error.response.data : error.message)
  }
}
export async function registerHoneygain(email: string, axios: any) {
  try {
    const body = {
      email: email,
      password: email
    }
    const response = await axios.post('https://dashboard.honeygain.com/api/v1/users', body, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0'
      }
    })
    console.log('User created successfully:', response.data.data.access_token)
    return response.data.data.access_token
  } catch (error: any) {
    console.error('Error creating user:', error.response ? error.response.data : error.message)
    return null
  }
}
// Gọi API xác nhận đăng ký
export async function confirmUserRegistration(accessToken: string, axios: any) {
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
  } catch (error: any) {
    console.error('Error confirming user:', error.response ? error.response.data : error.message)
  }
}

// Hàm chính
export async function verifyEmail(email: string, axios: any) {
  const subjectToFind = 'Verify your email address 📬'
  const [login, domain] = email.split('@')

  await new Promise((resolve) => setTimeout(resolve, 3000))

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Lấy danh sách email
    const emails = await getEmails(login, domain, axios)

    if (emails && emails.length > 0) {
      // Tìm email có subject cụ thể
      const emailToVerify = await findEmailBySubject(emails, subjectToFind)

      if (emailToVerify) {
        console.log(`Found email with subject "${subjectToFind}".`)
        const emailId = emailToVerify.id

        // Lấy chi tiết email và tìm link đầu tiên
        const firstHref = await getEmailDetailsAndFirstHref(login, domain, emailId, axios)
        if (firstHref) {
          console.log('First href:', firstHref)
          return firstHref
        }
      } else {
        console.log(`No email with subject "${subjectToFind}" found yet, retrying...`)
      }
    } else {
      console.log('No emails received yet, retrying...')
    }

    // Chờ 5 giây trước khi kiểm tra lại
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
}

export async function getCodeEmail(email: string, axios: any): Promise<string | null> {
  const subjectToFind = 'Verification Code 🔑 | Honeygain'
  const [login, domain] = email.split('@')
  await new Promise((resolve) => setTimeout(resolve, 3000))
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Lấy danh sách email
    const emails = await getEmails(login, domain, axios)

    if (emails && emails.length > 0) {
      // Tìm email có subject cụ thể
      const emailToVerify = await findEmailByVerificationCodeSubject(emails, subjectToFind)

      if (emailToVerify) {
        console.log(`Found email with subject "${subjectToFind}".`)
        const emailId = emailToVerify.id

        // Lấy mã OTP từ chi tiết email
        const otp = await getOTPFromEmailDetails(login, domain, emailId, axios)
        if (otp) {
          console.log('OTP:', otp)
          return otp // Trả về mã OTP
        }
      } else {
        console.log(`No email with subject "${subjectToFind}" found yet, retrying...`)
      }
    } else {
      console.log('No emails received yet, retrying...')
    }

    // Chờ một khoảng thời gian ngắn trước khi kiểm tra lại (ví dụ 5 giây)
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
}

export async function addIdJump(accessToken: string, jtKey: string, axios: any) {
  try {
    const body = {
      jt_toggle: true,
      jt_key: jtKey,
      wallet: 'account_id'
    }
    const response = await axios.patch('https://dashboard.honeygain.com/api/v2/settings/jt', body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    console.log('add Id Jump:', response.data)
  } catch (error: any) {
    console.error('Error calling JT Toggle API:', error.response ? error.response.data : error.message)
  }
}
export async function confirmWithOTP(accessToken: string, otp: string, axios: any) {
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
export async function fetchNewAccessToken(email: string, axios: any) {
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
export async function unlockAchievementsHoneygain(accessToken: string, axios: any) {
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
export async function followXJumptask(accessToken: string, userId: string, postId: string, axios: any) {
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
      return
    } catch (error: any) {
      attempts++
      console.error(
        `Attempt ${attempts} failed. Error following X Jump task:`,
        error.response ? error.response.data : error.message
      )
      if (attempts < maxRetries) {
        console.log('Retrying in 2 seconds...')
        await sleep(2000)
      } else {
        console.error('Max retries reached. Aborting follow.')
        break
      }
    }
  }
}
export async function claimRewardsHoneygain(accessToken: string, id: string, axios: any) {
  const maxRetries = 3
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
      return
    } catch (error: any) {
      attempts++
      console.error(
        `Attempt ${attempts} failed. Error claiming rewards:`,
        error.response ? error.response.data : error.message
      )

      if (attempts < maxRetries) {
        console.log('Retrying in 2 seconds...')
        await sleep(2000)
      } else {
        console.error('Max retries reached. Aborting claim.')
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
        console.log('Account deleted successfully with new proxy:', currentProxy)
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
