import { useState, useMemo, useEffect, useRef } from 'react'
import styles from './general.module.css'
import radarData from './geopoliticalRadarData.json'
import {
  Radar, Activity, Bell, Calendar, Users, FileText,
  ArrowRight, ChevronRight,
  AlertCircle, AlertTriangle, Clock,
  TrendingUp, TrendingDown, MessageSquare,
  Sparkles, Eye, Building2,
  Gavel, Stethoscope, Megaphone, Send,
  ExternalLink, Link2, Target, MapPin, Flag,
  Lightbulb, BadgeCheck, Pin, Lock, ScanLine, Layers,
  Hash, Bot, Database, FileCheck2, Workflow,
  Fingerprint, Settings2, Download, Mail, Sunrise,
  Smartphone, X, Inbox, Gauge, Compass, Briefcase, ShieldCheck,
  ChevronDown,
} from 'lucide-react'

/* ══════════════════════════════════════════════════════════════════════
   Geopolitical Radar · Decision Support System
   Public Affairs platform demo · Single-file architecture · data-driven

   All business content is loaded from ./geopoliticalRadarData.json.
   This file keeps only UI logic, the icon map, formatting helpers and
   rendering logic. Replacing the JSON refreshes the entire demo.
   ══════════════════════════════════════════════════════════════════════ */

/* ── Icon map: JSON stores icon keys as strings, resolved here ── */
const ICONS = {
  Radar, Activity, Bell, Calendar, Users, FileText,
  AlertCircle, AlertTriangle, Clock, TrendingUp, TrendingDown,
  MessageSquare, Sparkles, Eye, Building2, Gavel, Stethoscope,
  Megaphone, Send, ExternalLink, Link2, Target, MapPin, Flag,
  Lightbulb, BadgeCheck, Pin, Lock, ScanLine, Layers, Hash, Bot,
  Database, FileCheck2, Workflow, Fingerprint, Settings2, Download,
  Mail, Sunrise, Smartphone, Inbox, Gauge, Compass, Briefcase,
  ShieldCheck, ChevronDown,
}
const Icon = ({ name, ...props }) => {
  const Cmp = ICONS[name] || Activity
  return <Cmp {...props} />
}

/* ── Data slices with defensive defaults ── */
const META          = radarData.meta || {}
const TABS          = radarData.tabs || []
const HORIZONS      = radarData.horizons || []
const HORIZON_CONFIG = radarData.horizonConfig || {}
const CATEGORIES    = radarData.categories || []
const SIGNALS       = radarData.signals || []
const DAILY_BRIEF   = radarData.dailyBrief || {}
const ALERTS        = radarData.alerts || []
const MOBILE_PREVIEW = radarData.mobilePreview || {}
const AGENDA        = radarData.agenda || {}
const COPILOT       = radarData.copilot || {}
const VIEW_HEADERS  = radarData.viewHeaders || {}
const FEATURE_INTROS = radarData.featureIntros || {}
const FEATURE_INTRO_KICKER = radarData.featureIntroKicker || ''
const FEATURE_INTRO_KICKER_ICON = radarData.featureIntroKickerIcon || 'Compass'

const DEFAULT_TAB = TABS[0]?.id || 'signal'
const DEFAULT_HORIZON = HORIZONS[0]?.id || 'today'

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════ */
const sevLabel = {
  risk: 'Critical',
  warn: 'Attention',
  info: 'Monitoring',
  ok:   'Under control',
}

/* Converts angle (deg, 0=up, clockwise) to coordinates */
const polar = (cx, cy, r, angleDeg) => {
  const rad = (angleDeg - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/* Radius of each signal on the radar based on its impact */
const signalRadius = (impact) => {
  if (impact === 'critical') return 60
  if (impact === 'high')     return 105
  if (impact === 'medium')   return 150
  return 195
}

/* Distributes angles within a sector using a stable offset (deterministic) */
const signalAngle = (cat, idx) => {
  const meta = CATEGORIES.find(c => c.id === cat)
  const base = meta ? meta.angle : 0
  const seed = (idx * 37) % 45 - 22
  return base + seed
}

/* Stable per-signal index within its category, for deterministic placement */
const catIndex = (signal) => {
  const sameCat = SIGNALS.filter(s => s.cat === signal.cat)
  return Math.max(0, sameCat.findIndex(s => s.id === signal.id))
}

/* External link chip · clean source chip with external-link icon */
function SourceChip({ source, url, size = 9, className }) {
  const content = (<><Link2 size={size} /> {source}{url && <ExternalLink size={size} />}</>)
  if (url) {
    return (
      <a
        className={className}
        href={url}
        target="_blank"
        rel="noreferrer"
        title={source}
      >
        {content}
      </a>
    )
  }
  return <span className={className}>{content}</span>
}

/* ══════════════════════════════════════════════════════════════════════
   DELIVERY TO USER · single compact executive tag
   ══════════════════════════════════════════════════════════════════════ */
function DeliveryToUser({ icon = 'Send', channels, frequency, note }) {
  return (
    <div className={styles.deliveryTag} title={note || ''}>
      <div className={styles.deliveryTagLabel}>
        <Icon name={icon} size={11} strokeWidth={2.4} />
        <span>Delivery to user</span>
      </div>
      <div className={styles.deliveryTagBody}>{channels}</div>
      <div className={styles.deliveryTagFreq}>{frequency}</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   TOPBAR · brand + tab navigation + status
   ══════════════════════════════════════════════════════════════════════ */
function TopBar({ activeTab, onTabChange, status }) {
  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <ScanLine size={14} strokeWidth={2.4} />
          </div>
          <div className={styles.brandText}>
            <div className={styles.brandTitle}>{META.productName || 'Geopolitical Radar'}</div>
            <div className={styles.brandSub}>Decision Support System for Public Affairs</div>
          </div>
        </div>
      </div>

      <nav className={styles.tabBar}>
        {TABS.map(t => {
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`${styles.tabBarItem} ${active ? styles.tabBarItemActive : ''}`}
              title={t.label}
            >
              <Icon name={t.icon} size={13} strokeWidth={2.4} />
              <span className={styles.tabBarLabel}>{t.label}</span>
              <span className={styles.tabBarLabelShort}>{t.short}</span>
            </button>
          )
        })}
      </nav>

      <div className={styles.topbarRight}>
        <div className={styles.statusPill}>
          <span className={styles.statusDot} />
          <span>{status}</span>
        </div>
        <button className={styles.iconBtn} title="Notifications">
          <Bell size={14} />
          <span className={styles.iconBadge} />
        </button>
        <button className={styles.iconBtn} title="Settings">
          <Settings2 size={14} />
        </button>
      </div>
    </header>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   VIEW HEADER · per-tab page header
   ══════════════════════════════════════════════════════════════════════ */
function ViewHeader({ eyebrowIcon, eyebrow, title, sub, controls }) {
  return (
    <header className={styles.viewHeader}>
      <div className={styles.viewHeaderLeft}>
        <div className={styles.viewEyebrow}>
          {eyebrowIcon && <Icon name={eyebrowIcon} size={11} strokeWidth={2.4} />}
          <span>{eyebrow}</span>
        </div>
        <h1 className={styles.viewTitle}>{title}</h1>
        {sub && <p className={styles.viewSub}>{sub}</p>}
      </div>
      {controls && <div className={styles.viewHeaderRight}>{controls}</div>}
    </header>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   FEATURE INTRO · standalone executive summary block per tab
   Maps each tab to its PPT feature. Data-driven, defensive rendering.
   ══════════════════════════════════════════════════════════════════════ */
function FeatureIntro({ intro }) {
  if (!intro) return null

  return (
    <section className={styles.featureIntro}>
      <div className={styles.featureIntroMain}>
        {FEATURE_INTRO_KICKER && (
          <div className={styles.featureIntroKicker}>
            <Icon name={FEATURE_INTRO_KICKER_ICON} size={11} strokeWidth={2.4} />
            <span>{FEATURE_INTRO_KICKER}</span>
          </div>
        )}
        {intro.eyebrow && <div className={styles.featureIntroEyebrow}>{intro.eyebrow}</div>}
        {intro.title && <h2 className={styles.featureIntroTitle}>{intro.title}</h2>}
        {intro.body && <p className={styles.featureIntroBody}>{intro.body}</p>}
      </div>

      {intro.points?.length > 0 && (
        <ul className={styles.featureIntroPoints}>
          {intro.points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   KPI STRIP · driven by horizon config
   ══════════════════════════════════════════════════════════════════════ */
const KPI_DEFS = [
  { key: 'signals',      label: 'Signals monitored',     hue: 'neutral', icon: 'Activity' },
  { key: 'critical',     label: 'Critical alerts',       hue: 'risk',    icon: 'AlertCircle' },
  { key: 'stakeholders', label: 'Stakeholders impacted', hue: 'warn',    icon: 'Users' },
  { key: 'milestones',   label: 'Documents to review',   hue: 'info',    icon: 'Flag' },
  { key: 'reputation',   label: 'Reputational exposure', hue: 'warn',    icon: 'Megaphone' },
  { key: 'confidence',   label: 'Source confidence',     hue: 'ok',      icon: 'BadgeCheck' },
]
function KpiStrip({ horizon }) {
  const cfg = HORIZON_CONFIG[horizon] || {}
  const kpis = cfg.kpis || {}
  return (
    <section className={styles.kpiStrip}>
      {KPI_DEFS.map((k, i) => {
        const data = kpis[k.key] || { value: '—', hint: '' }
        return (
          <div key={i} className={styles.kpiTile}>
            <div className={styles.kpiHead}>
              <span className={`${styles.kpiIcon} ${styles[`kpiIcon_${k.hue}`]}`}>
                <Icon name={k.icon} size={11} strokeWidth={2.4} />
              </span>
              <span className={styles.kpiLabel}>{k.label}</span>
            </div>
            <div className={`${styles.kpiVal} ${styles[`kpiVal_${k.hue}`]}`}>{data.value}</div>
            <div className={`${styles.kpiHint} ${styles[`kpiHint_${k.hue}`]}`}>{data.hint}</div>
          </div>
        )
      })}
    </section>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   SIGNAL INTELLIGENCE RADAR · big SVG
   ══════════════════════════════════════════════════════════════════════ */
const CRITICALITY_DRIVERS = [
  { label: 'Source category',       weight: '35%', hint: 'official regulatory vs news' },
  { label: 'Urgency score',         weight: '25%', hint: 'as provided in the brief' },
  { label: 'Criticality score',     weight: '25%', hint: 'as provided in the brief' },
  { label: 'Evidence link',         weight: '15%', hint: 'direct source available' },
]
const CRITICALITY_TIERS = [
  { label: 'Critical',      tone: 'risk', hint: 'urgency \u2265 80' },
  { label: 'Attention',     tone: 'warn', hint: 'urgency 60\u201379' },
  { label: 'Monitoring',    tone: 'info', hint: 'urgency 40\u201359' },
  { label: 'Under control', tone: 'ok',   hint: 'positive / opportunity' },
]

function SignalRadar({ selected, onSelect, filterCat, setFilterCat }) {
  const cx = 250, cy = 250
  const rings = [60, 105, 150, 200]
  const ringLabels = ['Critical', 'Attention', 'Monitoring', 'Under control']
  const [showLogic, setShowLogic] = useState(false)

  const visible = useMemo(() => (
    filterCat === 'all' ? SIGNALS : SIGNALS.filter(s => s.cat === filterCat)
  ), [filterCat])

  return (
    <div className={styles.radarPanel}>
      <div className={styles.radarHead}>
        <div className={styles.radarHeadLeft}>
          <div className={styles.panelEyebrow}>
            <Radar size={11} strokeWidth={2.4} />
            <span>Signal Intelligence Radar</span>
          </div>
          <h2 className={styles.panelTitle}>What is moving in your environment</h2>
        </div>
        <div className={styles.radarFilters}>
          <button
            className={`${styles.catChip} ${filterCat === 'all' ? styles.catChipActive : ''}`}
            onClick={() => setFilterCat('all')}
          >
            <Layers size={10} /> All ({SIGNALS.length})
          </button>
          {CATEGORIES.map(c => {
            const n = SIGNALS.filter(s => s.cat === c.id).length
            return (
              <button
                key={c.id}
                className={`${styles.catChip} ${styles[`catChip_${c.hue}`]} ${filterCat === c.id ? styles.catChipActive : ''}`}
                onClick={() => setFilterCat(c.id)}
              >
                <Icon name={c.icon} size={10} /> {c.short} <span className={styles.catChipCount}>{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.radarBody}>
        <div className={styles.radarStage}>
          <svg viewBox="-50 -50 600 600" className={styles.radarSvg}>
            <defs>
              <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%"  stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="60%" stopColor="#F2F6FB" stopOpacity="1" />
                <stop offset="100%" stopColor="#E8EFF7" stopOpacity="1" />
              </radialGradient>
              <radialGradient id="radarCenter" cx="50%" cy="50%" r="50%">
                <stop offset="0%"  stopColor="rgba(14, 95, 168, 0.18)" />
                <stop offset="60%" stopColor="rgba(14, 95, 168, 0.04)" />
                <stop offset="100%" stopColor="rgba(14, 95, 168, 0)" />
              </radialGradient>
              <filter id="signalGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="beamGrad" gradientUnits="userSpaceOnUse" x1="250" y1="250" x2="250" y2="55">
                <stop offset="0%"   stopColor="#0E5FA8" stopOpacity="0" />
                <stop offset="70%"  stopColor="#0E5FA8" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#0E5FA8" stopOpacity="0.75" />
              </linearGradient>
            </defs>

            {/* Radial background */}
            <circle cx={cx} cy={cy} r={210} fill="url(#radarBg)" />
            <circle cx={cx} cy={cy} r={210} fill="url(#radarCenter)" />

            {/* Rotating sweep beam */}
            <g className={styles.radarBeam}>
              <line
                x1={cx} y1={cy}
                x2={cx} y2={cy - 200}
                stroke="url(#beamGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from={`0 ${cx} ${cy}`}
                to={`360 ${cx} ${cy}`}
                dur="7s"
                repeatCount="indefinite"
              />
            </g>

            {/* Concentric rings */}
            {rings.map((r, i) => (
              <circle
                key={r}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={i === 0 ? '#0E5FA8' : '#D8DEEA'}
                strokeWidth={i === 0 ? 0.8 : 0.6}
                strokeDasharray={i === 0 ? '0' : '2 4'}
                opacity={i === 0 ? 0.35 : 0.55}
              />
            ))}

            {/* Ring labels */}
            {rings.map((r, i) => (
              <text
                key={`lbl-${r}`}
                x={cx + 26}
                y={cy - r + 4}
                textAnchor="start"
                className={styles.radarRingLabel}
              >
                {ringLabels[i]}
              </text>
            ))}

            {/* Spokes */}
            {[0, 60, 120, 180, 240, 300].map(a => {
              const p = polar(cx, cy, 200, a)
              return (
                <line
                  key={a}
                  x1={cx} y1={cy} x2={p.x} y2={p.y}
                  stroke="#D8DEEA"
                  strokeWidth="0.6"
                  strokeDasharray="2 3"
                  opacity="0.7"
                />
              )
            })}

            {/* Category labels */}
            {CATEGORIES.map(c => {
              const lblPos = polar(cx, cy, 248, c.angle)
              return (
                <g key={c.id}>
                  <text
                    x={lblPos.x}
                    y={lblPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`${styles.radarCatLabel} ${filterCat === c.id ? styles.radarCatLabelActive : ''}`}
                  >
                    {c.label}
                  </text>
                </g>
              )
            })}

            {/* Center */}
            <circle cx={cx} cy={cy} r={5} fill="#0E5FA8" opacity="0.85" />
            <circle cx={cx} cy={cy} r={9} fill="none" stroke="#0E5FA8" strokeWidth="0.6" opacity="0.4" />

            {/* Signals · deterministic placement (uses stored pos if present) */}
            {visible.map((s) => {
              const idx = catIndex(s)
              let p
              if (s.pos && typeof s.pos.x === 'number' && typeof s.pos.y === 'number') {
                p = { x: cx - 200 + s.pos.x * 400, y: cy - 200 + s.pos.y * 400 }
              } else {
                const angle = signalAngle(s.cat, idx)
                const r = signalRadius(s.impact)
                p = polar(cx, cy, r, angle)
              }
              const isSel = selected === s.id
              const dotR = s.impact === 'critical' ? 8 : s.impact === 'high' ? 7 : 6
              return (
                <g
                  key={s.id}
                  className={`${styles.radarSignal} ${isSel ? styles.radarSignalSel : ''}`}
                  onClick={() => onSelect(s.id)}
                  filter="url(#signalGlow)"
                >
                  <circle
                    cx={p.x} cy={p.y}
                    r={dotR + 6}
                    className={`${styles.radarHalo} ${styles[`radarHalo_${s.sev}`]}`}
                  />
                  <circle
                    cx={p.x} cy={p.y}
                    r={dotR}
                    className={`${styles.radarDot} ${styles[`radarDot_${s.sev}`]}`}
                  />
                  {isSel && (
                    <circle
                      cx={p.x} cy={p.y}
                      r={dotR + 11}
                      fill="none"
                      stroke="#0B0E14"
                      strokeWidth="1"
                      opacity="0.6"
                    />
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        <div className={styles.radarLegend}>
          <div className={styles.radarLegendGroup}>
            <span className={styles.radarLegendLabel}>Criticality</span>
            <span className={styles.radarLegendItem}>
              <span className={`${styles.radarLegendDot} ${styles.radarLegendDot_risk}`} /> Critical
            </span>
            <span className={styles.radarLegendItem}>
              <span className={`${styles.radarLegendDot} ${styles.radarLegendDot_warn}`} /> Attention
            </span>
            <span className={styles.radarLegendItem}>
              <span className={`${styles.radarLegendDot} ${styles.radarLegendDot_info}`} /> Monitoring
            </span>
            <span className={styles.radarLegendItem}>
              <span className={`${styles.radarLegendDot} ${styles.radarLegendDot_ok}`} /> Under control
            </span>
          </div>
          <div className={styles.radarLegendGroup}>
            <span className={styles.radarLegendLabel}>Reading the radar</span>
            <span className={styles.radarLegendHintItem}><Compass size={10} /> Inner ring = highest impact</span>
            <span className={styles.radarLegendHintItem}><BadgeCheck size={10} /> Source confidence shown in detail</span>
          </div>
          <button
            type="button"
            className={`${styles.radarLogicCta} ${showLogic ? styles.radarLogicCtaOpen : ''}`}
            onClick={() => setShowLogic(s => !s)}
          >
            <Gauge size={12} strokeWidth={2.4} />
            <span>How signals are classified</span>
            <ChevronDown size={12} className={styles.radarLogicCtaChevron} />
          </button>
        </div>

        {showLogic && (
          <div className={styles.radarLogicExpand}>
            <div className={styles.radarLogicHead}>
              <Gauge size={11} strokeWidth={2.4} />
              <span className={styles.radarLogicTitle}>How signals are classified</span>
              <button
                type="button"
                className={styles.radarLogicClose}
                onClick={() => setShowLogic(false)}
                aria-label="Close scoring logic"
              >
                <X size={11} />
              </button>
            </div>
            <p className={styles.radarLogicLead}>
              Criticality is derived from the fields supplied in the brief: source category,
              urgency score, criticality score and the availability of a direct evidence link.
            </p>
            <div className={styles.radarLogicGrid}>
              <div className={styles.radarLogicCol}>
                <span className={styles.radarLogicColLbl}>Weighted drivers</span>
                <ul className={styles.radarLogicList}>
                  {CRITICALITY_DRIVERS.map((d, i) => (
                    <li key={i} className={styles.radarLogicDriver}>
                      <span className={styles.radarLogicDriverLbl}>{d.label}</span>
                      <span className={styles.radarLogicDriverWeight}>{d.weight}</span>
                      <span className={styles.radarLogicDriverHint}>{d.hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.radarLogicCol}>
                <span className={styles.radarLogicColLbl}>Tiers</span>
                <ul className={styles.radarLogicTiers}>
                  {CRITICALITY_TIERS.map((t, i) => (
                    <li key={i} className={`${styles.radarLogicTier} ${styles[`radarLogicTier_${t.tone}`]}`}>
                      <span className={`${styles.radarLogicTierDot} ${styles[`radarLogicTierDot_${t.tone}`]}`} />
                      <span className={styles.radarLogicTierLbl}>{t.label}</span>
                      <span className={styles.radarLogicTierHint}>{t.hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   SIGNAL DETAIL · panel to the right of the radar
   ══════════════════════════════════════════════════════════════════════ */
function SignalDetail({ signal }) {
  if (!signal) {
    return (
      <div className={styles.detailCard}>
        <div className={styles.detailEmpty}>
          <Eye size={20} />
          <p>Select a signal on the radar to inspect its evidence trail, drivers and recommended action.</p>
        </div>
      </div>
    )
  }
  const cat = CATEGORIES.find(c => c.id === signal.cat)
  const drivers = signal.drivers || []
  return (
    <div className={`${styles.detailCard} ${styles[`detailCard_${signal.sev}`]}`}>
      <div className={styles.detailHead}>
        <span className={`${styles.detailBadge} ${styles[`detailBadge_${signal.sev}`]}`}>
          {sevLabel[signal.sev]}
        </span>
        <span className={styles.detailCat}>
          <Icon name={cat?.icon || 'Activity'} size={11} /> {cat?.label}
        </span>
        <span className={styles.detailTime}><Clock size={10} /> {signal.time}</span>
      </div>
      <h3 className={styles.detailTitle}>{signal.title}</h3>
      <p className={styles.detailSummary}>{signal.summary}</p>

      {signal.why && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionLabel}>Why it matters</div>
          <p className={styles.detailSectionText}>{signal.why}</p>
        </div>
      )}

      {drivers.length > 0 && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionLabel}>Drivers</div>
          <ul className={styles.detailDrivers}>
            {drivers.map((d, i) => (
              <li key={i}>
                <span className={styles.detailDriverDot} />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {signal.action && (
        <div className={styles.detailSection}>
          <div className={styles.detailSectionLabel}>Recommended action</div>
          <div className={styles.detailAction}>
            <Target size={11} />
            <span>{signal.action}</span>
          </div>
        </div>
      )}

      <div className={styles.detailFooter}>
        <SourceChip source={signal.source} url={signal.url} size={10} className={styles.detailSource} />
        <div className={styles.detailConfidence}>
          <Fingerprint size={10} />
          <span>Confidence</span>
          <strong>{signal.confidence}%</strong>
        </div>
      </div>

      <div className={styles.detailButtons}>
        {signal.url ? (
          <a className={styles.btnPrimary} href={signal.url} target="_blank" rel="noreferrer">
            <FileText size={11} /> Open evidence trail
          </a>
        ) : (
          <button className={styles.btnPrimary}>
            <FileText size={11} /> Open evidence trail
          </button>
        )}
        <button className={styles.btnSecondary}>
          <Send size={11} /> Send to Teams
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   DAILY BRIEF · phase 1 flagship deliverable
   ══════════════════════════════════════════════════════════════════════ */
function DailyBrief() {
  const [exported, setExported] = useState(false)
  const b = DAILY_BRIEF

  const handleExport = () => {
    setExported(true)
    setTimeout(() => setExported(false), 2200)
    setTimeout(() => window.print(), 80)
  }

  const headlines = b.headlines || []
  const heroStats = b.heroStats || []
  const topics = b.topics || []
  const relatedTopics = b.relatedTopics || []
  const action = b.action || {}
  const outlook = b.outlook || {}
  const footer = b.footer || {}

  return (
    <div className={styles.briefCard}>
      <div className={styles.briefHead}>
        <div className={styles.briefHeadLeft}>
          <div className={styles.panelEyebrow}>
            <FileCheck2 size={11} strokeWidth={2.4} />
            <span>Daily Brief · {b.dateLabel}</span>
            {b.deliveredTag && (
              <span className={styles.briefDeliveredTag}>
                <BadgeCheck size={10} /> {b.deliveredTag}
              </span>
            )}
          </div>
          <h3 className={styles.briefTitle}>{b.title}</h3>
          <p className={styles.briefLead}>{b.lead}</p>
        </div>
        <div className={styles.briefHeadActions}>
          <button
            className={`${styles.briefExportBtn} ${exported ? styles.briefExportBtnDone : ''}`}
            onClick={handleExport}
          >
            {exported
              ? (<><BadgeCheck size={11} /> Brief exported</>)
              : (<><Download size={11} /> Export PDF</>)}
          </button>
          <button className={styles.briefShareBtn} title="Send to Teams">
            <Send size={11} /> Send to Teams
          </button>
        </div>
      </div>

      {/* Headlines */}
      <div className={styles.briefHeadlines}>
        <div className={styles.briefSectionHead}>
          <span className={`${styles.briefDot} ${styles.briefDot_risk}`} />
          <span>Headlines</span>
          {b.headlinesMeta && <span className={styles.briefSectionMeta}>{b.headlinesMeta}</span>}
        </div>
        <ol className={styles.headlineList}>
          {headlines.map((h, i) => (
            <li key={i} className={styles.headlineItem}>
              <span className={styles.headlineNum}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.headlineText}>
                <strong>{h.bold}</strong>{h.tail}
              </span>
              <SourceChip source={h.source} url={h.url} size={10} className={styles.headlineSource} />
            </li>
          ))}
        </ol>
      </div>

      {/* Hero stats */}
      <div className={styles.briefHero}>
        {heroStats.map((s, i) => (
          <div key={i} className={`${styles.briefHeroStat} ${styles[`briefHeroStat_${s.tone}`]}`}>
            <span className={`${styles.briefHeroStatVal} ${styles[`briefHeroStatVal_${s.tone}`]}`}>{s.val}</span>
            <span className={styles.briefHeroStatLbl}>{s.lbl}</span>
            <span className={`${styles.briefHeroStatHint} ${styles[`briefHeroStatHint_${s.tone}`]}`}>{s.hint}</span>
          </div>
        ))}
      </div>

      {/* Topic blocks + related topics */}
      <div className={styles.briefGrid}>
        {topics.map((block, i) => (
          <div key={i} className={styles.briefBlock}>
            <div className={styles.briefBlockHead}>
              <span className={`${styles.briefDot} ${styles[`briefDot_${block.tone}`]}`} />
              <span>{block.group}</span>
            </div>
            <ul className={styles.briefList}>
              {(block.items || []).map((it, j) => (
                <li key={j}>
                  <span>{it.text}</span>
                  <SourceChip source={it.source} url={it.url} size={9} className={styles.itemSource} />
                </li>
              ))}
            </ul>
          </div>
        ))}

        {relatedTopics.length > 0 && (
          <div className={styles.briefBlock}>
            <div className={styles.briefBlockHead}>
              <span className={`${styles.briefDot} ${styles.briefDot_info}`} />
              <span>Related topics</span>
            </div>
            <ul className={styles.relatedList}>
              {relatedTopics.map((r, i) => (
                <li key={i} className={styles.relatedItem}>
                  <span className={styles.relatedA}>{r.a}</span>
                  <ArrowRight size={10} className={styles.relatedArrow} />
                  <span className={styles.relatedB}>{r.b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommended action */}
      {action.text && (
        <div className={styles.briefAction}>
          <div className={styles.briefActionLeft}>
            <div className={styles.briefActionLabel}>
              <Target size={11} /> {action.label || 'Recommended action'}
            </div>
            <p className={styles.briefActionText}>{action.text}</p>
          </div>
          {typeof action.confidence === 'number' && (
            <div className={styles.briefActionRight}>
              <div className={styles.briefActionMetric}>
                <Fingerprint size={11} />
                <div>
                  <span className={styles.briefActionMetricLbl}>Confidence</span>
                  <strong>{action.confidence}%</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Regulatory document queue (was "outlook") */}
      {(outlook.items || []).length > 0 && (
        <div className={styles.briefOutlook}>
          <div className={styles.briefOutlookHead}>
            <Sunrise size={11} />
            <span>{outlook.head || 'Regulatory document queue'}</span>
          </div>
          <div className={styles.briefOutlookList}>
            {outlook.items.map((o, i) => (
              <div key={i} className={styles.briefOutlookItem}>
                <span className={styles.briefOutlookDay}>{o.day}</span>
                <span className={styles.briefOutlookText}>{o.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={styles.briefFooter}>
        {(footer.metaItems || []).map((m, i) => (
          <span key={i} className={styles.briefMeta}>
            <Icon name={m.icon || 'BadgeCheck'} size={11} /> {m.text}
          </span>
        ))}
        <span className={styles.briefMetaSpacer} />
        <button className={styles.briefFooterBtn}>
          <Mail size={11} /> {footer.buttonLabel || 'Schedule daily delivery'}
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   REAL-TIME ALERTS — clickable backlog + mobile lock-screen preview
   ══════════════════════════════════════════════════════════════════════ */
function MobileAlertScreen({ selectedAlert, secondaryAlert }) {
  if (!selectedAlert) return null
  const mp = MOBILE_PREVIEW
  return (
    <div className={styles.mobileScreen}>
      <div className={styles.mobileScreenHead}>
        <div className={styles.panelEyebrow}>
          <Smartphone size={11} strokeWidth={2.4} />
          <span>How a critical alert reaches you on mobile</span>
        </div>
        <h3 className={styles.panelTitle}>Lock-screen preview · {sevLabel[selectedAlert.sev]} alert</h3>
        <p className={styles.mobileScreenLead}>
          Critical and Attention-tier events fire a push to your phone and Microsoft Teams.
          Tap any item in the backlog to see exactly how it lands.
        </p>
      </div>

      <div className={styles.mobilePhoneBig}>
        <div className={styles.mobileNotchBig} />
        <div className={styles.mobileStatusBar}>
          <span className={styles.mobileStatusTime}>{mp.statusTime || '9:41'}</span>
          <span className={styles.mobileStatusRight}>
            <span className={styles.mobileStatusDots}>•••</span>
            <span className={styles.mobileStatusBattery} />
          </span>
        </div>

        <div className={styles.mobileLockClock}>
          <div className={styles.mobileLockDate}>{mp.lockDate || ''}</div>
          <div className={styles.mobileLockTime}>{mp.lockTime || '9:41'}</div>
        </div>

        <div className={styles.mobileNotifStack}>
          <div className={`${styles.mobileNotifExpanded} ${styles[`mobileNotifExpanded_${selectedAlert.sev}`]}`}>
            <div className={styles.mobileNotifAppRow}>
              <span className={styles.mobileNotifAppIcon}>
                <ScanLine size={10} strokeWidth={2.4} />
              </span>
              <span className={styles.mobileNotifAppName}>{mp.appName || 'GEOPOLITICAL RADAR'}</span>
              <span className={styles.mobileNotifTime}>now</span>
            </div>
            <div className={`${styles.mobileNotifTier} ${styles[`mobileNotifTier_${selectedAlert.sev}`]}`}>
              {selectedAlert.sev === 'risk'
                ? <AlertCircle size={11} strokeWidth={2.4} />
                : <AlertTriangle size={11} strokeWidth={2.4} />}
              <span>{sevLabel[selectedAlert.sev]} alert · {selectedAlert.kind}</span>
            </div>
            <div className={styles.mobileNotifTitle}>{selectedAlert.title}</div>
            <div className={styles.mobileNotifBody}>{selectedAlert.why}</div>
            <div className={styles.mobileNotifMetaRow}>
              <span className={styles.mobileNotifMetaItem}>
                <Link2 size={9} /> {selectedAlert.source}
              </span>
              <span className={styles.mobileNotifMetaItem}>
                <Fingerprint size={9} /> {selectedAlert.conf}% confidence
              </span>
            </div>
            <div className={styles.mobileNotifActions}>
              <button className={styles.mobileNotifAction}>View full brief</button>
              <button className={styles.mobileNotifAction}>Open evidence</button>
            </div>
          </div>

          {secondaryAlert && (
            <div className={styles.mobileNotifCollapsed}>
              <div className={styles.mobileNotifAppRow}>
                <span className={styles.mobileNotifAppIcon}>
                  <ScanLine size={10} strokeWidth={2.4} />
                </span>
                <span className={styles.mobileNotifAppName}>{mp.appName || 'GEOPOLITICAL RADAR'}</span>
                <span className={styles.mobileNotifTime}>{secondaryAlert.time}</span>
              </div>
              <div className={styles.mobileNotifCollapsedTitle}>
                <span className={`${styles.mobileNotifCollapsedSev} ${styles[`mobileNotifCollapsedSev_${secondaryAlert.sev}`]}`}>
                  {sevLabel[secondaryAlert.sev]}
                </span>
                {secondaryAlert.title}
              </div>
            </div>
          )}

          {ALERTS.length > 2 && (
            <div className={styles.mobileNotifHint}>
              Swipe down for {ALERTS.length - 2} more notifications
            </div>
          )}
        </div>
      </div>

      <div className={styles.mobileScreenFooter}>
        <span className={styles.mobileScreenFooterItem}>
          <Bell size={11} /> Mobile push notification
        </span>
        <span className={styles.mobileScreenFooterItem}>
          <Send size={11} /> Mirrored to Microsoft Teams
        </span>
        <span className={styles.mobileScreenFooterItem}>
          <Lock size={11} /> No confidential payload on lock screen
        </span>
      </div>
    </div>
  )
}

function AlertsFeed({ selectedAlertId, onSelect }) {
  return (
    <div className={styles.alertsPanel}>
      <div className={styles.panelHead}>
        <div>
          <div className={styles.panelEyebrow}>
            <Inbox size={11} strokeWidth={2.4} />
            <span>Alert backlog</span>
          </div>
          <h3 className={styles.panelTitle}>Prioritized by impact · tap to preview on mobile</h3>
        </div>
        <button className={styles.linkBtn}>
          View all <ArrowRight size={11} />
        </button>
      </div>

      <ul className={styles.alertsList}>
        {ALERTS.map(a => {
          const active = a.id === selectedAlertId
          return (
            <li
              key={a.id}
              className={`${styles.alertItem} ${styles[`alertItem_${a.sev}`]} ${active ? styles.alertItemActive : ''}`}
              onClick={() => onSelect(a.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') onSelect(a.id) }}
            >
              <div className={`${styles.alertRail} ${styles[`alertRail_${a.sev}`]}`} />
              <div className={styles.alertBody}>
                <div className={styles.alertTopRow}>
                  <span className={`${styles.alertSev} ${styles[`alertSev_${a.sev}`]}`}>
                    {a.sev === 'risk' ? <AlertCircle size={9} /> : a.sev === 'warn' ? <AlertTriangle size={9} /> : <Activity size={9} />}
                    {sevLabel[a.sev]}
                  </span>
                  <span className={styles.alertKind}>{a.kind}</span>
                  <span className={styles.alertTime}>{a.time}</span>
                </div>
                <div className={styles.alertTitle}>{a.title}</div>
                <div className={styles.alertWhy}>{a.why}</div>
                <div className={styles.alertBottomRow}>
                  <span className={styles.alertAction}>
                    <Lightbulb size={10} /> {a.action}
                  </span>
                  <SourceChip source={`${a.source} · ${a.conf}%`} url={a.url} size={10} className={styles.alertSource} />
                </div>
              </div>
              <ChevronRight size={14} className={styles.alertChevron} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   AGENDA INTELLIGENCE · Regulatory Intelligence Queue
   (Refactored from meeting-based agenda to brief-grounded document queue)
   ══════════════════════════════════════════════════════════════════════ */
function RegulatoryQueueRow({ doc, priority }) {
  return (
    <div className={`${styles.regRow} ${priority ? styles[`regRow_${doc.tone || 'info'}`] : ''}`}>
      {priority && <div className={`${styles.regRail} ${styles[`alertRail_${doc.tone || 'info'}`]}`} />}
      <div className={styles.regRowBody}>
        <div className={styles.regRowTop}>
          {doc.kind && <span className={styles.regKind}>{doc.kind}</span>}
          {doc.date && <span className={styles.regDate}><Clock size={9} /> {doc.date}</span>}
        </div>
        <div className={styles.regTitle}>{doc.title}</div>
        <SourceChip source={doc.source} url={doc.url} size={9} className={styles.regSource} />
      </div>
      {doc.url && (
        <a className={styles.regOpen} href={doc.url} target="_blank" rel="noreferrer" title="Open official document">
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  )
}

function AgendaIntelligence() {
  const a = AGENDA
  const priority = a.priorityDocuments || []
  const queue = a.reviewQueue || []
  const officialSources = a.officialSources || []
  const paFollowUp = a.paFollowUp || []
  const footer = a.footer || {}

  return (
    <div className={styles.agendaPanel}>
      <div className={styles.agendaPanelTop}>
        <div>
          <div className={styles.panelEyebrow}>
            <Calendar size={11} strokeWidth={2.4} />
            <span>{a.eyebrow || 'Regulatory Intelligence Queue'}</span>
          </div>
          <h3 className={styles.panelTitle}>{a.title || 'Priority regulatory documents from the latest brief.'}</h3>
        </div>
        <div className={styles.agendaTopRight}>
          <span className={styles.agendaSyncTag}>
            <Workflow size={10} /> {a.syncTag || 'Derived from latest radar brief'}
          </span>
        </div>
      </div>

      <div className={styles.agendaCard}>
        <div className={styles.agendaCardLeft}>
          {a.summary?.topic && (
            <div className={styles.agendaMeetHead}>
              <div className={styles.agendaTagRow}>
                {a.summary?.rangeLabel && (
                  <span className={styles.agendaWhen}><Clock size={11} /> {a.summary.rangeLabel}</span>
                )}
                <span className={styles.agendaWhere}><Database size={11} /> EMA · FDA · NHS</span>
              </div>
              <p className={styles.agendaMeetTopic}>{a.summary.topic}</p>
            </div>
          )}

          {/* Priority regulatory documents */}
          {priority.length > 0 && (
            <div className={styles.agendaParticipants}>
              <div className={styles.agendaSecLabel}>
                Priority regulatory documents
                <span className={styles.agendaSecHint}> · highest urgency &amp; criticality in the latest brief</span>
              </div>
              <div className={styles.regList}>
                {priority.map((doc, i) => (
                  <RegulatoryQueueRow key={i} doc={doc} priority />
                ))}
              </div>
            </div>
          )}

          {/* Review queue */}
          {queue.length > 0 && (
            <div className={styles.agendaContext}>
              <div className={styles.agendaSecLabel}>
                Review queue
                <span className={styles.agendaSecHint}> · additional EMA documents to triage</span>
              </div>
              <div className={styles.regList}>
                {queue.map((doc, i) => (
                  <RegulatoryQueueRow key={i} doc={doc} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.agendaCardRight}>
          {officialSources.length > 0 && (
            <div className={styles.agendaBlock}>
              <div className={`${styles.agendaBlockHead} ${styles.agendaBlockHead_info}`}>
                <ShieldCheck size={11} /> Official sources
              </div>
              <div className={styles.regSourceList}>
                {officialSources.map((s, i) => (
                  <div key={i} className={styles.regSourceItem}>
                    <span className={styles.regSourceBadge}>{s.label}</span>
                    <div className={styles.regSourceInfo}>
                      <div className={styles.regSourceKind}>{s.kind}</div>
                      <div className={styles.regSourceNote}>{s.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {paFollowUp.length > 0 && (
            <div className={styles.agendaBlock}>
              <div className={`${styles.agendaBlockHead} ${styles.agendaBlockHead_ok}`}>
                <Target size={11} /> Potential PA follow-up
              </div>
              <ul className={styles.agendaBlockList}>
                {paFollowUp.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className={styles.agendaFooter}>
        <div className={styles.agendaFooterLeft}>
          {typeof footer.documentCount === 'number' && (
            <span className={styles.agendaFooterMeta}>
              <FileText size={11} />
              <span>{footer.documentCount} regulatory documents</span>
            </span>
          )}
          {typeof footer.newsCount === 'number' && (
            <span className={styles.agendaFooterMeta}>
              <Megaphone size={11} />
              <span>{footer.newsCount} news items</span>
            </span>
          )}
          <span className={styles.agendaFooterMeta}>
            <BadgeCheck size={11} />
            <span>All sources from the latest brief</span>
          </span>
        </div>
        <div className={styles.agendaFooterButtons}>
          <button className={styles.btnSecondary}>
            <Download size={11} /> {footer.buttonSecondary || 'Export regulatory queue'}
          </button>
          <button className={styles.btnPrimary}>
            <ExternalLink size={11} /> {footer.buttonPrimary || 'Open EMA document index'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   SIGNAL INTELLIGENCE COPILOT · grounded conversational layer
   ══════════════════════════════════════════════════════════════════════ */
function SignalCopilot() {
  const responses = COPILOT.responses || {}
  const suggestions = COPILOT.suggestions || []
  const opening = COPILOT.openingQuestion || suggestions[0]

  const [history, setHistory] = useState(() => {
    if (opening && responses[opening]) {
      return [
        { role: 'user', text: opening },
        { role: 'bot', ...responses[opening] },
      ]
    }
    return []
  })
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [history])

  const ask = (q) => {
    const r = responses[q] || {
      text: 'This query requires data not available in the latest brief. The assistant only answers when it can anchor a response to the supplied brief.',
      sources: [],
      conf: 0,
    }
    setHistory(h => [...h, { role: 'user', text: q }, { role: 'bot', ...r }])
    setInput('')
  }

  return (
    <div className={`${styles.qaPanel} ${styles.copilotPanel}`}>
      <div className={styles.qaHead}>
        <div className={styles.copilotHeadLeft}>
          <div className={styles.panelEyebrow}>
            <Sparkles size={11} strokeWidth={2.4} />
            <span>{COPILOT.eyebrow || 'Signal Intelligence Copilot'}</span>
          </div>
          <h3 className={styles.panelTitle}>{COPILOT.title || 'Ask the radar. Trace the evidence.'}</h3>
          {COPILOT.lead && <p className={styles.copilotLead}>{COPILOT.lead}</p>}
        </div>
        <span className={styles.qaTrustTag}>
          <ShieldCheck size={10} /> {COPILOT.trustTag || 'Grounded in the latest brief'}
        </span>
      </div>

      <div className={styles.qaThread} ref={scrollRef}>
        {history.map((m, i) => (
          m.role === 'user' ? (
            <div key={i} className={styles.qaUser}>
              <div className={styles.qaUserBubble}>{m.text}</div>
              <div className={styles.qaUserAvatar}>{COPILOT.userInitials || 'PA'}</div>
            </div>
          ) : (
            <div key={i} className={styles.qaBot}>
              <div className={styles.qaBotAvatar}>
                <Sparkles size={10} />
              </div>
              <div className={styles.qaBotBubble}>
                <p className={styles.qaBotText}>{m.text}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className={styles.qaBotMeta}>
                    <div className={styles.qaSources}>
                      {m.sources.map((s, j) => (
                        <span key={j} className={styles.qaSourceChip}>
                          <Link2 size={9} /> {s}
                        </span>
                      ))}
                    </div>
                    <div className={styles.qaConf}>
                      <Fingerprint size={10} /> {m.conf}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        ))}
      </div>

      <div className={styles.qaSuggestions}>
        {suggestions.filter(q => q !== history[history.length - 2]?.text).slice(0, 3).map((q, i) => (
          <button key={i} className={styles.qaSuggestionBtn} onClick={() => ask(q)}>
            {q}
          </button>
        ))}
      </div>

      <div className={styles.qaInputBar}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) ask(input.trim()) }}
          placeholder={COPILOT.placeholder || 'Ask about a signal or regulatory document…'}
        />
        <button
          className={styles.qaSendBtn}
          onClick={() => input.trim() && ask(input.trim())}
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   ROOT APP
   ══════════════════════════════════════════════════════════════════════ */
export default function GeneralApp() {
  const [activeTab, setActiveTab]   = useState(DEFAULT_TAB)
  const [horizon, setHorizon]       = useState(DEFAULT_HORIZON)
  const [filterCat, setFilterCat]   = useState('all')
  const [selected, setSelected]     = useState(SIGNALS[0]?.id || null)
  const [selectedAlertId, setSelectedAlertId] = useState(ALERTS[0]?.id || null)
  const [mounted, setMounted]       = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  const selectedSignal = useMemo(
    () => SIGNALS.find(s => s.id === selected),
    [selected]
  )

  const selectedAlert = useMemo(
    () => ALERTS.find(a => a.id === selectedAlertId),
    [selectedAlertId]
  )

  const hcfg = HORIZON_CONFIG[horizon] || {}
  const vhSignal = VIEW_HEADERS.signal || {}
  const vhBrief  = VIEW_HEADERS.brief || {}
  const vhAlerts = VIEW_HEADERS.alerts || {}
  const vhAgenda = VIEW_HEADERS.agenda || {}

  const secondaryAlert = ALERTS.length
    ? ALERTS[(ALERTS.findIndex(a => a.id === selectedAlertId) + 1) % ALERTS.length]
    : null

  return (
    <div className={`${styles.page} ${mounted ? styles.pageReady : ''}`}>
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        status={META.topbarStatus || META.status || 'Monitoring active'}
      />
      <main className={styles.main}>

        {/* ───── TAB 1: SIGNAL INTELLIGENCE + COPILOT ───── */}
        {activeTab === 'signal' && (
          <div key="signal" className={styles.view}>
            <ViewHeader
              eyebrowIcon={vhSignal.eyebrowIcon}
              eyebrow={vhSignal.eyebrow}
              title={
                vhSignal.titleEm
                  ? <>{vhSignal.titlePre}<em>{vhSignal.titleEm}</em></>
                  : (vhSignal.title || 'Signal Intelligence')
              }
              sub={`${hcfg.summary || ''} ${vhSignal.sub || ''}`.trim()}
              controls={
                vhSignal.delivery && (
                  <DeliveryToUser
                    icon={vhSignal.delivery.icon}
                    channels={vhSignal.delivery.channels}
                    frequency={vhSignal.delivery.frequency}
                    note={vhSignal.delivery.note}
                  />
                )
              }
            />
            <FeatureIntro intro={FEATURE_INTROS.signal} />
            <div className={styles.horizonBar}>
              <span className={styles.horizonBarLabel}>{vhSignal.horizonBarLabel || 'Analytical scope'}</span>
              <div className={styles.tabRow}>
                {HORIZONS.map(h => (
                  <button
                    key={h.id}
                    className={`${styles.tab} ${horizon === h.id ? styles.tabActive : ''}`}
                    onClick={() => setHorizon(h.id)}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
              <span className={styles.horizonBarRange}>showing {hcfg.rangeLabel || ''}</span>
            </div>
            <KpiStrip horizon={horizon} />
            <div className={styles.signalLayout}>
              <div className={styles.signalLeft}>
                <SignalRadar
                  selected={selected}
                  onSelect={setSelected}
                  filterCat={filterCat}
                  setFilterCat={setFilterCat}
                />
                <SignalDetail signal={selectedSignal} />
              </div>
              <aside className={styles.signalRight}>
                <SignalCopilot />
              </aside>
            </div>
          </div>
        )}

        {/* ───── TAB 2: DAILY BRIEF ───── */}
        {activeTab === 'brief' && (
          <div key="brief" className={styles.view}>
            <ViewHeader
              eyebrowIcon={vhBrief.eyebrowIcon}
              eyebrow={vhBrief.eyebrow}
              title={vhBrief.title || 'Daily Brief'}
              sub={vhBrief.sub}
              controls={
                vhBrief.delivery && (
                  <DeliveryToUser
                    icon={vhBrief.delivery.icon}
                    channels={vhBrief.delivery.channels}
                    frequency={vhBrief.delivery.frequency}
                    note={vhBrief.delivery.note}
                  />
                )
              }
            />
            <FeatureIntro intro={FEATURE_INTROS.brief} />
            <div className={styles.viewBriefContainer}>
              <DailyBrief />
            </div>
          </div>
        )}

        {/* ───── TAB 3: REAL-TIME ALERTS ───── */}
        {activeTab === 'alerts' && (
          <div key="alerts" className={styles.view}>
            <ViewHeader
              eyebrowIcon={vhAlerts.eyebrowIcon}
              eyebrow={vhAlerts.eyebrow}
              title={vhAlerts.title || 'Real-time Alerts'}
              sub={vhAlerts.sub}
              controls={
                vhAlerts.delivery && (
                  <DeliveryToUser
                    icon={vhAlerts.delivery.icon}
                    channels={vhAlerts.delivery.channels}
                    frequency={vhAlerts.delivery.frequency}
                    note={vhAlerts.delivery.note}
                  />
                )
              }
            />
            <FeatureIntro intro={FEATURE_INTROS.alerts} />
            <div className={styles.alertsLayout}>
              <AlertsFeed
                selectedAlertId={selectedAlertId}
                onSelect={setSelectedAlertId}
              />
              <MobileAlertScreen
                selectedAlert={selectedAlert}
                secondaryAlert={secondaryAlert}
              />
            </div>
          </div>
        )}

        {/* ───── TAB 4: AGENDA INTELLIGENCE · Regulatory Queue ───── */}
        {activeTab === 'agenda' && (
          <div key="agenda" className={styles.view}>
            <ViewHeader
              eyebrowIcon={vhAgenda.eyebrowIcon}
              eyebrow={vhAgenda.eyebrow}
              title={vhAgenda.title || 'Agenda Intelligence'}
              sub={vhAgenda.sub}
              controls={
                vhAgenda.delivery && (
                  <DeliveryToUser
                    icon={vhAgenda.delivery.icon}
                    channels={vhAgenda.delivery.channels}
                    frequency={vhAgenda.delivery.frequency}
                    note={vhAgenda.delivery.note}
                  />
                )
              }
            />
            <FeatureIntro intro={FEATURE_INTROS.agenda} />
            <div className={styles.viewAgendaContainer}>
              <AgendaIntelligence />
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
