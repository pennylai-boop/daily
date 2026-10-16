'use client'

/**
 * 前台訪客追蹤：把 pageview／click 打到 admin.introvista.ai 公開端點。
 * 各產品複製同一份（site 由 layout 傳入）。本機 localhost 預設不回報，以免污染正式統計。
 */
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export type SiteAnalyticsSite = 'home' | 'fgpay' | 'namegain' | 'ownio' | 'daily'

type Props = {
  site: SiteAnalyticsSite
  origin?: string
}

function analyticsOrigin(explicit?: string): string | null {
  const env = (explicit || process.env.NEXT_PUBLIC_SITE_ANALYTICS_ORIGIN || '').trim().replace(/\/$/, '')
  if (env) return env
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return null
  }
  return 'https://admin.introvista.ai'
}

function uid(prefix: string): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

function storageGet(storage: Storage, key: string, create: () => string): string {
  try {
    const existing = storage.getItem(key)
    if (existing) return existing
    const created = create()
    storage.setItem(key, created)
    return created
  } catch {
    return create()
  }
}

function firstTouch(site: string): { referrer: string; landingUrl: string } {
  const landKey = `iv_${site}_land`
  const refKey = `iv_${site}_ref`
  const here = new URL(window.location.href)
  const landing = `${here.pathname}${here.search}` || '/'
  let landingUrl = landing
  let referrer = ''
  try {
    const savedLand = sessionStorage.getItem(landKey)
    if (savedLand) landingUrl = savedLand
    else sessionStorage.setItem(landKey, landing)

    const savedRef = sessionStorage.getItem(refKey)
    if (savedRef !== null) {
      referrer = savedRef
    } else {
      const raw = document.referrer || ''
      try {
        if (raw && new URL(raw).host !== here.host) referrer = raw
      } catch {
        referrer = raw
      }
      sessionStorage.setItem(refKey, referrer)
    }
  } catch {
    referrer = document.referrer || ''
  }
  return { referrer, landingUrl }
}

function localeOf(path: string): string | null {
  const prefixed = path.match(/^\/(ZH|EN)(?:\/|$)/i)
  if (prefixed) return prefixed[1].toUpperCase()
  const lang = document.documentElement.lang || ''
  if (!lang) return null
  if (lang.toLowerCase().startsWith('zh')) return 'ZH'
  if (lang.toLowerCase().startsWith('en')) return 'EN'
  return lang.slice(0, 8)
}

function postBeacon(url: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload)
  try {
    const blob = new Blob([body], { type: 'text/plain' })
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url, blob)) return
  } catch {
    /* fall through */
  }
  void fetch(url, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'text/plain' },
    keepalive: true,
    mode: 'cors',
  }).catch(() => {})
}

function clickLabel(el: Element): string {
  const labelled = el.closest('a,button,[role="button"]') ?? el
  const aria = labelled.getAttribute('aria-label')
  if (aria?.trim()) return aria.trim().slice(0, 200)
  const text = (labelled.textContent || '').replace(/\s+/g, ' ').trim()
  return text.slice(0, 200)
}

export function SiteAnalyticsTracker({ site, origin }: Props) {
  const pathname = usePathname()

  useEffect(() => {
    const base = analyticsOrigin(origin)
    if (!base) return

    const visitorId = storageGet(localStorage, `iv_${site}_vid`, () => uid('v'))
    const sessionId = storageGet(sessionStorage, `iv_${site}_sid`, () => uid('s'))
    const { referrer, landingUrl } = firstTouch(site)
    const path = pathname || '/'
    const locale = localeOf(path)

    postBeacon(`${base}/api/public/site-analytics/pageview`, {
      site,
      path,
      locale,
      referrer,
      landingUrl,
      visitorId,
      sessionId,
    })

    const onClick = (ev: MouseEvent) => {
      const target = ev.target
      if (!(target instanceof Element)) return
      const hit = target.closest('a,button,[role="button"]')
      if (!hit) return
      if (hit.closest('[data-no-track]')) return
      const href = hit instanceof HTMLAnchorElement ? hit.href : hit.getAttribute('href')
      postBeacon(`${base}/api/public/site-analytics/click`, {
        site,
        path,
        locale,
        href,
        label: clickLabel(hit),
        tag: hit.tagName.toLowerCase(),
        visitorId,
        sessionId,
      })
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [pathname, site, origin])

  return null
}
