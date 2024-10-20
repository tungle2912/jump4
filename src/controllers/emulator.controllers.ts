import { execShellCommand, log, sleep } from '~/lib/utils'

export const execEmulatorCommand = (deviceId: string) => {
  const _deviceId = deviceId

  return async (cmd: string) => {
    try {
      await execShellCommand(`adb -s ${_deviceId} shell ${cmd}`)
    } catch (error) {
      console.log('Failed to execute command: ', error)
    }
  }
}
class EmulatorController {
  async clearMemoryCacheHoneygain({ deviceId }: { deviceId: string }) {
    try {
      const exec = await execEmulatorCommand(deviceId)
      await sleep(5000)
      exec('input draganddrop 300 150 360 120')
      console.log('drag and drop honeygain')
      await sleep(5000)
      exec('input tap 100 600')
      console.log('click clear cache option')
      await sleep(3000)
      exec('input tap 120 350')
      await sleep(3000)
      exec('input tap 420 600')
      console.log('Cleared honeygain cache data')
      await sleep(2000)
      exec('input keyevent 3')
      console.log('Go home')
      exec('input keyevent 187')
      await sleep(2000)
      exec('input swipe 300 500 300 600')
      console.log('Close all apps')
      await sleep(3000)
      exec('input tap 480 100')
    } catch (err) {
      console.log('Failed to clear memory cache: ', err)
    }
  }

  async loginHoneygain({ deviceId, email }: { deviceId: string; email: string }) {
    try {
      const exec = await execEmulatorCommand(deviceId)
      // await sleep(5000)
      // await exec(`input tap 350 150`)
      // console.log('click honeygain'))

      // await sleep(5000)
      // await exec(`input tap 300 900`)
      // console.log('click i agree to the terms'))

      // await sleep(3000)
      // await exec(`input tap 300 900`)
      // console.log('click skip'))

      // await sleep(3000)
      // await exec(`input tap 450 550`)
      // console.log('click no'))

      // await exec(`input swipe 270 800 270 500`)
      // console.log('Scrolled down'))
      // await sleep(2000)

      // await exec(`input tap 300 900`)
      // console.log('click done'))
      // await sleep(4000)
      // await exec(`input tap 500 900`)
      // console.log('click more'))

      await exec(`input swipe 270 500 270 800`)
      console.log('Scrolled down')
      await sleep(2000)

      await sleep(3000)
      await exec(`input tap 300 425`)
      console.log('click login')

      await sleep(3000)
      // Nhập email
      await exec(`input tap 250 250`)
      await exec(`input text '${email}'`)
      console.log('Email entered')
      await sleep(1000)

      // Nhập password
      await exec(`input tap 250 350`)
      await exec(`input text '${email}'`)
      console.log('Password entered')
      await sleep(1000)

      // Nhấn nút đăng nhập
      await exec(`input tap 250 500`)
      console.log('Login successful')

      // await sleep(3000)
      // exec('input keyevent 3')

      await this.logoutHoneygain({
        deviceId
      })
    } catch (err) {
      console.log('ADB connect failed', err)
    }
  }

  async logoutHoneygain({ deviceId }: { deviceId: string }) {
    const exec = await execEmulatorCommand(deviceId)
    // // Nhấn vào nút "More"
    // await exec(`input tap 500 900`)
    // console.log('More button clicked'))
    await sleep(5000)
    // Cuộn xuống dưới cùng
    await exec(`input swipe 270 800 270 200`)
    console.log('Scrolled down')
    await sleep(4000)
    // Nhấn vào nút "Logout"
    await exec(`input tap 300 825`)
    console.log('Logout successful')
    await sleep(5000)
    exec('input keyevent 4')
    // await this.clearMemoryCacheHoneygain({
    //   deviceId
    // })
  }
}

const emulatorController = new EmulatorController()
export default emulatorController
