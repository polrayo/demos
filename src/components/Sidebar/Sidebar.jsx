import styles from './Sidebar.module.css'
import { SECTIONS } from '../../constants'

/* ── Iconos SVG estilo SF Symbols ─────────────────────────── */

const IconGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
)

const IconList = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6"  x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6"  x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)

const IconLayers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
)

const IconSun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1"  x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1"  y1="12" x2="3"  y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
    <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
  </svg>
)

const IconMoon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const IconGraph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5"  cy="12" r="2"/>
    <circle cx="19" cy="5"  r="2"/>
    <circle cx="19" cy="19" r="2"/>
    <circle cx="12" cy="5"  r="2"/>
    <line x1="7"  y1="11" x2="17" y2="6"/>
    <line x1="7"  y1="13" x2="17" y2="18"/>
    <line x1="14" y1="5"  x2="17" y2="5"/>
  </svg>
)

const IconChevron = ({ direction }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
       style={{ transform: direction === 'right' ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

/* ── Definición de los ítems de navegación ─────────────────── */

const NAV_ITEMS = [
  { id: SECTIONS.GENERAL, label: 'Visión de cartera ',      Icon: IconLayers }, 
  { id: SECTIONS.DETALLE2, label: 'Visión de gestor ',      Icon: IconList }, 
  { id: SECTIONS.DETALLE, label: 'Visión de caso',      Icon: IconGraph }, 
]

/**
 * Sidebar colapsable estilo macOS Sequoia.
 * - Expandido: 260px — muestra icono + etiqueta
 * - Colapsado: 64px  — muestra solo icono con tooltip nativo
 *
 * Props:
 *   collapsed         {boolean}  Estado actual del sidebar
 *   onToggle          {Function} Alterna collapsed
 *   activeSection     {string}   Sección activa
 *   onSectionChange   {Function} Callback al seleccionar sección
 *   darkMode          {boolean}  Estado del tema
 *   onToggleDarkMode  {Function} Alterna dark/light
 */
const Sidebar = ({
  collapsed,
  onToggle,
  activeSection,
  onSectionChange,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>

      {/* ── Cabecera ────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandIcon} aria-hidden="true">BS</div>
          <span className={styles.brandName}>Gestión de recuperaciones</span>
        </div>

        {/* Botón colapsar / expandir */}
        <button
          className={styles.toggleBtn}
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir panel' : 'Colapsar panel'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <IconChevron direction={collapsed ? 'right' : 'left'} />
        </button>
      </div>

      {/* ── Navegación principal ────────────────────────────── */}
      <nav className={styles.nav} aria-label="Secciones principales">
        <ul className={styles.navList}>
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <li key={id}>
              <button
                className={`${styles.navItem} ${activeSection === id ? styles.navItemActive : ''}`}
                onClick={() => onSectionChange(id)}
                title={collapsed ? label : undefined}
                aria-current={activeSection === id ? 'page' : undefined}
              >
                <span className={styles.navIcon}><Icon /></span>
                <span className={styles.navLabel}>{label}</span>
                {activeSection === id && (
                  <span className={styles.activeIndicator} aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Pie del sidebar ─────────────────────────────────── */}
      <div className={styles.footer}>
        <button
          className={styles.themeBtn}
          onClick={onToggleDarkMode}
          aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
          title={darkMode ? 'Light Mode' : 'Dark Mode'}
        >
          <span className={styles.navIcon}>
            {darkMode ? <IconSun /> : <IconMoon />}
          </span>
          <span className={styles.navLabel}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </div>

    </aside>
  )
}

export default Sidebar
