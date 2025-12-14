// src/modules/zns/zns.client.ts
const ZALO_TEMPLATE_LIST_URL = 'https://business.openapi.zalo.me/template/all'
const ZALO_TEMPLATE_INFO_URL =
  'https://business.openapi.zalo.me/template/info/v2'
const ZALO_TEMPLATE_SAMPLE_URL =
  'https://business.openapi.zalo.me/template/sample-data'

function assertOk(res: Response, label: string) {
  if (!res.ok) {
    const e: any = new Error(`${label} failed: ${res.status}`)
    e.statusCode = res.status
    return e
  }
  return null
}

export async function zaloListTemplates(
  accessToken: string,
  opts: { offset?: number; limit?: number }
) {
  const offset = opts.offset ?? 0
  const limit = opts.limit ?? 100
  const url = new URL(ZALO_TEMPLATE_LIST_URL)
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('limit', String(limit))

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      access_token: accessToken
    }
  })
  const err = assertOk(res, 'Zalo template list')
  const json = await res.json().catch(() => ({}))
  if (err) {
    err.message += ` ${JSON.stringify(json).slice(0, 500)}`
    throw err
  }
  return json
}

export async function zaloGetTemplateInfo(
  accessToken: string,
  templateId: string
) {
  const url = new URL(ZALO_TEMPLATE_INFO_URL)
  url.searchParams.set('template_id', templateId)

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      access_token: accessToken
    }
  })
  const err = assertOk(res, 'Zalo template info')
  const json = await res.json().catch(() => ({}))
  if (err) {
    err.message += ` ${JSON.stringify(json).slice(0, 500)}`
    throw err
  }
  return json
}

export async function zaloGetTemplateSample(
  accessToken: string,
  templateId: string
) {
  const url = new URL(ZALO_TEMPLATE_SAMPLE_URL)
  url.searchParams.set('template_id', templateId)

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      access_token: accessToken
    }
  })
  const err = assertOk(res, 'Zalo template sample')
  const json = await res.json().catch(() => ({}))
  if (err) {
    err.message += ` ${JSON.stringify(json).slice(0, 500)}`
    throw err
  }
  return json
}
