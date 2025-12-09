const ZALO_TEMPLATE_LIST_URL = 'https://business.openapi.zalo.me/template/all'

export async function fetchZnsTemplates(
  accessToken: string,
  opts?: { offset?: number; limit?: number; status?: number }
) {
  const offset = opts?.offset ?? 0
  const limit = opts?.limit ?? 100
  const status = opts?.status ?? 2

  const url = new URL(ZALO_TEMPLATE_LIST_URL)
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('status', String(status))

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      access_token: accessToken
    }
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Zalo template list failed: ${res.status} ${text}`)
    // @ts-ignore
    err.statusCode = res.status
    throw err
  }

  const data = await res.json().catch(() => ({}))
  return {
    offset,
    limit,
    status,
    raw: data
  }
}
