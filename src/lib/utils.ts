import { exec } from 'child_process'
import puppeteer, { Page } from 'puppeteer'
export const confirm = async (link: string, delay = 1500) => {
  try {
    const browser = await puppeteer.launch({
      headless: true
    })
    const page = await browser.newPage()
    await page.goto(link, {
      waitUntil: 'networkidle2'
    })
    await sleep(delay)
    console.log('Email confirmed!')
    await browser.close()
  } catch (error) {
    console.log('Failed!')
    console.log(error)
  }
}
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
export const execShellCommand = (cmd: string) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`)
      }
      if (stderr) {
        reject(`Stderr: ${stderr}`)
      }
      resolve(stdout)
    })
  })
}

export const log = console.log

export const authenticatePage = async ({
  page,
  proxyCredentials
}: {
  page: Page
  proxyCredentials: { proxyUsername: string; proxyPassword: string }
}) => {
  await page.authenticate({
    username: proxyCredentials.proxyUsername,
    password: proxyCredentials.proxyPassword
  })
}
