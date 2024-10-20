import { exec } from 'child_process'
import { Page } from 'puppeteer'

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
