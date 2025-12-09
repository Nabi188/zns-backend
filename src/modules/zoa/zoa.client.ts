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
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err: any = new Error(
      `Zalo token exchange failed: ${res.status} ${text}`
    )
    err.statusCode = res.status
    throw err
  }
  return res.json()
}
