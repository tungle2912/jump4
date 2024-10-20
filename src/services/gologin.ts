import envVariables from '~/constants/env-variables'
const GoLogin = async () => {
  const _GoLogin = await import('gologin')
  return await _GoLogin.GologinApi({
    token: envVariables.GOLOGIN_TOKEN
  })
}

export default GoLogin
