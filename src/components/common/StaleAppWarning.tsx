import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

const POLL_INTERVAL = 60_000
const DELAY_DURATION = 30 * 60 * 1000

export function StaleAppWarning() {
  const [currentVersion, setCurrentVersion] = useState('')
  const [remoteVersion, setRemoteVersion] = useState('')
  const [delayedUntil, setDelayedUntil] = useState(0)

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="version"]')
    const content = meta?.content || ''
    if (content && content !== '{{version}}') {
      setCurrentVersion(content)
    }
  }, [])

  const fetchRemoteVersion = useCallback(() => {
    fetch(`/version.txt?${Date.now()}`)
      .then((r) => r.text())
      .then((v) => setRemoteVersion(v.trim()))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!currentVersion) return
    fetchRemoteVersion()
    const id = setInterval(fetchRemoteVersion, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [currentVersion, fetchRemoteVersion])

  if (!currentVersion || !remoteVersion || currentVersion === remoteVersion || delayedUntil > Date.now()) {
    return null
  }

  function reload() {
    const { href } = window.location
    const cleanHref = href.replace(/[?&]refresh=\d+/, '')
    const separator = cleanHref.includes('?') ? '&' : '?'
    window.location.href = `${cleanHref}${separator}refresh=${Date.now()}`
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 flex justify-center px-4 pb-2">
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm w-full">
        <RefreshCw className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium flex-1">גרסה חדשה זמינה</span>
        <button
          onClick={reload}
          className="bg-white text-primary-600 text-sm font-semibold rounded-xl px-3 py-1"
        >
          עדכון
        </button>
        <button
          onClick={() => setDelayedUntil(Date.now() + DELAY_DURATION)}
          className="text-white/70 text-xs"
        >
          אח״כ
        </button>
      </div>
    </div>
  )
}
