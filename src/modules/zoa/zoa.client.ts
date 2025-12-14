// src/modules/zoa/zoa.client.ts
import { envConfig } from '@/lib/envConfig'

const ZALO_OAUTH_TOKEN_URL = 'https://oauth.zaloapp.com/v4/oa/access_token'

export async function exchangeToken(code: string) {
  const form = new URLSearchParams()
  form.set('code', code)
  form.set('app_id', envConfig.ZALO_APP_ID)
  form.set('grant_type', 'authorization_code')

  const res = await fetch(ZALO_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      secret_key: envConfig.ZALO_APP_SECRET
    },
    body: form
  })

  const text = await res.text().catch(() => '')
  let json: any = {}
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }

  if (!res.ok || json?.error) {
    const e: any = new Error('zalo_token_exchange_failed')
    e.statusCode = res.status || 400
    e.payload = json
    throw e
  }

  return json
}

export async function getOaInfo(accessToken: string) {
  const res = await fetch('https://openapi.zalo.me/v2.0/oa/getoa', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', access_token: accessToken }
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json?.error) {
    const e: any = new Error('zalo_get_oa_failed')
    e.statusCode = res.status || 400
    e.payload = json
    throw e
  }
  return json.data as { oaid: string; name: string }
}
