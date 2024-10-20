import axios, { AxiosInstance } from 'axios'
import envVariables from '~/constants/env-variables'

class Request {
  instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: envVariables.GOLOGIN_BASE_URL,
      headers: {
        Authorization: `Bearer ${envVariables.GOLOGIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
  }
}

const request = new Request().instance

export default request
