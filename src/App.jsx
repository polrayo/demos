import { useEffect } from 'react'
import General from './pages/General/General'
import styles from './App.module.css'

function App() {
  /* Sincronizar con preferencia del sistema en tiempo real */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (isDark) => {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    }

    // Aplicar tema inicial
    applyTheme(mq.matches)

    // Escuchar cambios
    const handler = (e) => applyTheme(e.matches)
    mq.addEventListener('change', handler)

    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <General />
      </main>
    </div>
  )
}

export default App