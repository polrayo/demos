import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react' nodeEntries.reduce(
    (acc, node) => {
      const patients = normalizeNumber(node?.patients) ?? 0
      const patientsPrev = normalizeNumber(node?.patientsPrev) ?? 0
      const cost = normalizeNumber(node?.cost) ?? 0
      const costPrev = normalizeNumber(node?.costPrev ?? node?.cost) ?? 0
      const bottleneck = normalizeNumber(node?.bottleneck) ?? 0
      const bottleneckPrev = normalizeNumber(node?.bottleneckPrev ?? node?.bottleneck) ?? 0
      const conversion = normalizeNumber(node?.conversion) ?? 0
      const conversionPrev = normalizeNumber(node?.conversionPrev ?? node?.conversion) ?? 0

      acc.totalPatients += patients
      acc.totalPatientsPrev += patientsPrev
      acc.totalCost += cost
      acc.totalCostPrev += costPrev
      acc.totalBottleneck += bottleneck
      acc.totalBottleneckPrev += bottleneckPrev
      acc.totalConversion += conversion
      acc.totalConversionPrev += conversionPrev
      return acc
    },
    {
      totalPatients: 0,
      totalPatientsPrev: 0,
      totalCost: 0,
      totalCostPrev: 0,
      totalBottleneck: 0,
      totalBottleneckPrev: 0,
      totalConversion: 0,
      totalConversionPrev: 0,
    }
  )

  const count = nodeEntries.length || 1
  const avgBottleneck = totals.totalBottleneck / count
  const avgBottleneckPrev = totals.totalBottleneckPrev / count
  const avgConversion = totals.totalConversion / count
  const avgConversionPrev = totals.totalConversionPrev / count

  return [
    {
      label: 'Total Patients in Journey',
      value: totals.totalPatients.toLocaleString(),
      delta: formatSignedPercent(totals.totalPatients, totals.totalPatientsPrev),
      up: totals.totalPatients >= totals.totalPatientsPrev,
    },
    {
      label: 'Total Cost / Economic Burden',
      value: formatCurrencyCompact(totals.totalCost),
      delta: formatSignedPercent(totals.totalCost, totals.totalCostPrev),
      up: totals.totalCost <= totals.totalCostPrev,
    },
    {
      label: 'Bottleneck Severity Index',
      value: avgBottleneck.toFixed(2),
      delta: formatSignedAbsolute(avgBottleneck, avgBottleneckPrev, 2),
      up: avgBottleneck <= avgBottleneckPrev,
    },
    {
      label: 'Conversion Rate (Journey Efficiency)',
      value: `${Math.round(avgConversion)}%`,
      delta: formatSignedAbsolute(avgConversion, avgConversionPrev, 1),
      up: avgConversion >= avgConversionPrev,
    },
  ]
}

export function PlaybackProvider({ children }) {
  const [timeline, setTimeline] = useState([])
  const [frameIndex, setFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [baseFrameDelayMs, setBaseFrameDelayMs] = useState(2000)
  const [speedX, setSpeedX] = useState(1)
  const [timelineError, setTimelineError] = useState('')

  // UI shared state
  const [comparisonLeft, setComparisonLeft] = useState('Germany')
  const [comparisonRight, setComparisonRight] = useState('US')
  const [vicaempaEnabled, setVicaempaEnabled] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadTimeline() {
      try {
        setTimelineError('')
        const res = await fetch(TIMELINE_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        if (cancelled) return

        const snaps = Array.isArray(data?.snapshots) ? data.snapshots : []
        const delay = Number(data?.meta?.playback?.frame_duration_ms)

        setTimeline(snaps)
        setBaseFrameDelayMs(Number.isFinite(delay) ? delay : 2000)
        setFrameIndex(0)
        setIsPlaying(snaps.length > 1)
      } catch (error) {
        if (cancelled) return
        setTimelineError(
          `Timeline JSON not loaded. Put the file in /public as ${TIMELINE_URL}. (${String(error)})`
        )
      }
    }

    loadTimeline()

    return () => {
      cancelled = true
    }
  }, [])

  const effectiveDelayMs = useMemo(() => {
    const raw = Math.round(baseFrameDelayMs / Math.max(0.1, speedX))
    return Math.max(50, raw)
  }, [baseFrameDelayMs, speedX])

  const totalFrames = timeline.length
  const safeFrameIndex = Math.min(frameIndex, Math.max(totalFrames - 1, 0))
  const currentSnapshot = timeline[safeFrameIndex] ?? null

  useEffect(() => {
    if (!timeline.length || !isPlaying) return

    if (frameIndex >= timeline.length - 1) {
      setIsPlaying(false)
      return
    }

    const timer = window.setTimeout(() => {
      setFrameIndex((current) => {
        const next = current + 1
        return next >= timeline.length ? timeline.length - 1 : next
      })
    }, effectiveDelayMs)

    return () => window.clearTimeout(timer)
  }, [timeline, isPlaying, frameIndex, effectiveDelayMs])

  const play = useCallback(() => setIsPlaying(true), [])
  const pause = useCallback(() => setIsPlaying(false), [])
  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), [])
  const restart = useCallback(() => {
    setFrameIndex(0)
    setIsPlaying(timeline.length > 1)
  }, [timeline.length])

  const metrics = useMemo(() => getSnapshotMetrics(currentSnapshot), [currentSnapshot])

  const value = useMemo(
    () => ({
      timeline,
      totalFrames,
      frameIndex: safeFrameIndex,
      currentSnapshot,
      currentDate: currentSnapshot?.date ?? null,
      currentTMonths: currentSnapshot?.t_months ?? null,

      isPlaying,
      play,
      pause,
      togglePlay,
      restart,

      speedX,
      setSpeedX,
      availableSpeeds: [0.5, 1, 2, 4],

      baseFrameDelayMs,
      effectiveDelayMs,
      timelineError,
      metrics,

      comparisonLeft,
      comparisonRight,
      setComparisonLeft,
      setComparisonRight,

      vicaempaEnabled,
      setVicaempaEnabled,
    }),
    [
      timeline,
      totalFrames,
      safeFrameIndex,
      currentSnapshot,
      isPlaying,
      play,
      pause,
      togglePlay,
      restart,
      speedX,
      baseFrameDelayMs,
      effectiveDelayMs,
      timelineError,
      metrics,
      comparisonLeft,
      comparisonRight,
      vicaempaEnabled,
    ]
  )

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>
}

export function usePlayback() {
  const context = useContext(PlaybackContext)

  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider')
  }

  return context
}

const PlaybackContext = createContext(null)
const TIMELINE_URL = '/patient_journey_timeseries_5y_monthly.json'

const normalizeNumber = (v) => {
  if (v == null) return null
  if (typeof v === 'number') return v

  const str = String(v).trim()
  const multiplier = str.endsWith('M') ? 1_000_000 : str.endsWith('K') ? 1_000 : 1
  const cleaned = str.replace(/[€%,\s]/g, '').replace(/[MK]$/, '')
  const n = Number(cleaned)

  return Number.isFinite(n) ? n * multiplier : null
}

const formatCurrencyCompact = (value) => {
  const n = normalizeNumber(value) ?? 0
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `€${(n / 1_000).toFixed(1)}K`
  return `€${Math.round(n).toLocaleString()}`
}

const formatSignedPercent = (current, previous, digits = 1) => {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return '—'
  const delta = ((current / previous) - 1) * 100
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${delta.toFixed(digits)}%`
}

const formatSignedAbsolute = (current, previous, digits = 2) => {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return '—'
  const delta = current - previous
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${delta.toFixed(digits)}`
}

const getSnapshotMetrics = (snapshot) => {  const nodeEntries = Object.values(snapshot?.nodes ?? {})

  const totals = nodeEntries.reduce(
    (acc, node) => {
      const patients = normalizeNumber(node?.patients) ?? 0
      const patientsPrev = normalizeNumber(node?.patientsPrev) ?? 0
      const cost = normalizeNumber(node?.cost) ?? 0
      const costPrev = normalizeNumber(node?.costPrev ?? node?.cost) ?? 0
      const bottleneck = normalizeNumber(node?.bottleneck) ?? 0
      const bottleneckPrev = normalizeNumber(node?.bottleneckPrev ?? node?.bottleneck) ?? 0
      const conversion = normalizeNumber(node?.conversion) ?? 0
      const conversionPrev = normalizeNumber(node?.conversionPrev ?? node?.conversion) ?? 0

      acc.totalPatients += patients
      acc.totalPatientsPrev += patientsPrev
      acc.totalCost += cost
      acc.totalCostPrev += costPrev
      acc.totalBottleneck += bottleneck
      acc.totalBottleneckPrev += bottleneckPrev
      acc.totalConversion += conversion
      acc.totalConversionPrev += conversionPrev

      return acc
    },
    {
      totalPatients: 0,
      totalPatientsPrev: 0,
      totalCost: 0,
      totalCostPrev: 0,
      totalBottleneck: 0,
      totalBottleneckPrev: 0,
      totalConversion: 0,
      totalConversionPrev: 0,
    }
  )

  const count = nodeEntries.length || 1
  const avgBottleneck = totals.totalBottleneck / count
  const avgBottleneckPrev = totals.totalBottleneckPrev / count
  const avgConversion = totals.totalConversion / count
  const avgConversionPrev = totals.totalConversionPrev / count

  return [
    {
      label: 'Total Patients in Journey',
      value: totals.totalPatients.toLocaleString(),
      delta: formatSignedPercent(totals.totalPatients, totals.totalPatientsPrev),
      up: totals.totalPatients >= totals.totalPatientsPrev,
    },
    {
      label: 'Total Cost / Economic Burden',
      value: formatCurrencyCompact(totals.totalCost),
      delta: formatSignedPercent(totals.totalCost, totals.totalCostPrev),
      up: totals.totalCost <= totals.totalCostPrev,
    },
    {
      label: 'Bottleneck Severity Index',
      value: avgBottleneck.toFixed(2),
      delta: formatSignedAbsolute(avgBottleneck, avgBottleneckPrev, 2),
      up: avgBottleneck <= avgBottleneckPrev,
    },
    {
      label: 'Conversion Rate (Journey Efficiency)',
      value: `${Math.round(avgConversion)}%`,
      delta: formatSignedAbsolute(avgConversion, avgConversionPrev, 1),
      up: avgConversion >= avgConversionPrev,
    },
  ]
}

export function PlaybackProvider({ children }) {
  const [timeline, setTimeline] = useState([])
  const [frameIndex, setFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [baseFrameDelayMs, setBaseFrameDelayMs] = useState(2000)
  const [speedX, setSpeedX] = useState(1)
  const [timelineError, setTimelineError] = useState('')

  // UI shared state
  const [comparisonLeft, setComparisonLeft] = useState('Germany')
  const [comparisonRight, setComparisonRight] = useState('US')
  const [vicaempaEnabled, setVicaempaEnabled] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadTimeline() {
      try {
        setTimelineError('')

        const res = await fetch(TIMELINE_URL)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        if (cancelled) return

        const snaps = Array.isArray(data?.snapshots) ? data.snapshots : []
        const delay = Number(data?.meta?.playback?.frame_duration_ms)

        setTimeline(snaps)
        setBaseFrameDelayMs(Number.isFinite(delay) ? delay : 2000)
        setFrameIndex(0)
        setIsPlaying(snaps.length > 1)
      } catch (error) {
        if (cancelled) return

        setTimelineError(
          `Timeline JSON not loaded. Put the file in /public as ${TIMELINE_URL}. (${String(error)})`
        )
      }
    }

    loadTimeline()

    return () => {
      cancelled = true
    }
  }, [])

  const effectiveDelayMs = useMemo(() => {
    const raw = Math.round(baseFrameDelayMs / Math.max(0.1, speedX))
    return Math.max(50, raw)
  }, [baseFrameDelayMs, speedX])

  const totalFrames = timeline.length
  const safeFrameIndex = Math.min(frameIndex, Math.max(totalFrames - 1, 0))
  const currentSnapshot = timeline[safeFrameIndex] ?? null

  useEffect(() => {
    if (!timeline.length || !isPlaying) return

    if (frameIndex >= timeline.length - 1) {
      setIsPlaying(false)
      return
    }

    const timer = window.setTimeout(() => {
      setFrameIndex((current) => {
        const next = current + 1
        return next >= timeline.length ? timeline.length - 1 : next
      })
    }, effectiveDelayMs)

    return () => window.clearTimeout(timer)
  }, [timeline, isPlaying, frameIndex, effectiveDelayMs])

  const play = useCallback(() => setIsPlaying(true), [])
  const pause = useCallback(() => setIsPlaying(false), [])
  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), [])
  const restart = useCallback(() => {
    setFrameIndex(0)
    setIsPlaying(timeline.length > 1)
  }, [timeline.length])

  const metrics = useMemo(() => getSnapshotMetrics(currentSnapshot), [currentSnapshot])

  const value = useMemo(
    () => ({
      timeline,
      totalFrames,
      frameIndex: safeFrameIndex,
      currentSnapshot,
      currentDate: currentSnapshot?.date ?? null,
      currentTMonths: currentSnapshot?.t_months ?? null,

      isPlaying,
      play,
      pause,
      togglePlay,
      restart,

      speedX,
      setSpeedX,
      availableSpeeds: [0.5, 1, 2, 4],

      baseFrameDelayMs,
      effectiveDelayMs,
      timelineError,
      metrics,

      comparisonLeft,
      comparisonRight,
      setComparisonLeft,
      setComparisonRight,

      vicaempaEnabled,
      setVicaempaEnabled,
    }),
    [
      timeline,
      totalFrames,
      safeFrameIndex,
      currentSnapshot,
      isPlaying,
      play,
      pause,
      togglePlay,
      restart,
      speedX,
      baseFrameDelayMs,
      effectiveDelayMs,
      timelineError,
      metrics,
      comparisonLeft,
      comparisonRight,
      vicaempaEnabled,
    ]
  )

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>
}

export function usePlayback() {
  const context = useContext(PlaybackContext)

  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider')
  }

  return context
}