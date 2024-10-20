import ADB, { ADBOptions } from 'appium-adb'
import envVariables from '~/constants/env-variables'
import { execEmulatorCommand } from '~/controllers/emulator.controllers'

import { execShellCommand, log } from '~/lib/utils'

const dnmultiplayerPath = envVariables.DNMULTIPLAYER_PATH
const dnconsolePath = envVariables.DNCONSOLE_PATH

interface Emulator {
  udid: string
  state: string
}

class ADBService {
  private adb: ADB | null
  private devices: Emulator[]
  private deviceId: string

  constructor() {
    this.adb = null
    this.devices = []
    this.deviceId = ''
  }

  async getDeviceId(): Promise<string> {
    return this.deviceId
  }

  async getConnectedDevices(): Promise<Emulator[]> {
    return this.devices
  }

  async launch(opts?: Omit<ADBOptions, 'sdkRoot' | 'executable'>) {
    try {
      this.adb = await ADB.createADB({
        sdkRoot: envVariables.ADB_SDK_ROOT,
        executable: {
          path: envVariables.ADB_EXECUTABLE_PATH,
          defaultArgs: [],
          ...opts
        }
      })

      // Launch Multi LDPlayer
      //  execShellCommand(`start "" "${dnmultiplayerPath}"`)

      // First emulator has been started successfully.
      execShellCommand(`"${dnconsolePath}" launch --index 0`)
      // await sleep(60000)

      console.log('LDPlayer has been started successfully.')

      // Get list of devicesconst
      this.devices = await this.adb.getConnectedDevices()

      if (this.devices.length === 0) {
        console.log('No devices connected')
        return
      }

      console.log('List of devices: ', this.devices)
      const emulator = this.devices[0]
      this.deviceId = emulator.udid
    } catch (err) {
      console.log('Failed to connect to emulator')
    }
  }

  async closeEmulator(index: number = 0) {
    try {
      execShellCommand(`"${dnconsolePath}" quit --index ${index}`)
    } catch (err) {
      console.log('Faild to close emulator: ', err)
    }
  }

  async setProxy(proxyHost: string, proxyPort: string) {
    try {
      const exec = execEmulatorCommand(this.deviceId)
      const result = exec(`settings put global http_proxy ${proxyHost}:${proxyPort}`)
      console.log('Proxy đã được thiết lập thành công.')
      console.log(result)
    } catch (err) {
      console.log(`Lỗi khi thiết lập proxy: ${err}`)
    }
  }

  async clearProxy() {
    const adbCommand = 'adb shell settings put global http_proxy :0'
    try {
      const result = await execShellCommand(adbCommand)
      console.log('Proxy đã được xóa thành công.')
      console.log(result)
    } catch (err) {
      console.log(`Lỗi khi xóa proxy: ${err}`)
    }
  }
}

const adb = new ADBService()

export default adb
