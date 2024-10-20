import 'dotenv/config'

const envVariables = {
  GOLOGIN_BASE_URL: process.env.GOLOGIN_BASE_URL as string,
  JUMPTASK_BASE_URL: process.env.JUMPTASK_BASE_URL as string,
  GOLOGIN_TOKEN: process.env.GOLOGIN_TOKEN as string,
  EMAIL: process.env.EMAIL as string,
  PASSWORD: process.env.PASSWORD as string,
  REFERRAL_CODE: process.env.REFERRAL_CODE as string,
  JUMPTASK_ID: process.env.JUMPTASK_ID as string,
  ADB_SDK_ROOT: process.env.ADB_SDK_ROOT as string,
  ADB_EXECUTABLE_PATH: process.env.ADB_EXECUTABLE_PATH as string,
  DNMULTIPLAYER_PATH: process.env.DNMULTIPLAYER_PATH as string,
  DNCONSOLE_PATH: process.env.DNCONSOLE_PATH as string
} as const

export default envVariables
