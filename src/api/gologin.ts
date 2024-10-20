import { APIResponse, Cookie, IProfiles, ProxyProfile, ProxyProfileInfo } from '~/@types/data'
import request from './axios'
import axios from 'axios'

export const getProfles = async () => {
  return await request.get<IProfiles>('/v2')
}

export const getBrowserCookies = async ({ profileId }: { profileId: string }) => {
  return await request.get(`/${profileId}/cookies`)
}

export const loadCookies = async ({ profileId, data }: { profileId: string; data: Cookie[] }) => {
  return await request.post(`/${profileId}/cookies`, {
    data
  })
}

export const clearCookies = async (profileId: string) => {
  return await request.post(`/${profileId}/cookies?cleanCookies=true`)
}

export const addProxyToProfile = async ({ profileId, proxy }: { profileId: string; proxy: ProxyProfile }) => {
  return await request.patch(`/${profileId}/proxy`, proxy)
}

export const deleteProxyFromProfile = async (profileId: string) => {
  const _prx: ProxyProfile = {
    autoProxyRegion: 'us',
    host: '',
    mode: 'none',
    password: '',
    port: 80,
    torProxyRegion: 'us',
    username: ''
  }
  return await request.patch(`/${profileId}/proxy`, _prx)
}

export const getProxyProfileInfo = async () => {
  return await axios.get<APIResponse<ProxyProfileInfo>>('https://api.gologin.com/users-proxies')
}
