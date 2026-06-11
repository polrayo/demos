import { useEffect, useRef, useState } from 'react'

/**
 * Hook para animar elementos al entrar en el viewport.
 * Usa Intersection Observer API — sin dependencias externas.
 *
 * @param {IntersectionObserverInit} options - Opciones del observer (threshold, rootMargin, etc.)
 * @returns {[React.RefObject, boolean]} - [ref al elemento, isVisible]
 *
 * @example
 * const [ref, isVisible] = useScrollAnimation()
 * return <div ref={ref} className={isVisible ? styles.visible : ''}>...</div>
 */
const useScrollAnimation = (options = {}) => {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    /* El elemento se considera visible cuando al menos el 15% entra en el viewport,
       con un margen inferior para disparar la animación un poco antes */
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px',
      ...options,
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        /* Dejamos de observar una vez visible para optimizar rendimiento */
        observer.unobserve(element)
      }
    }, observerOptions)

    observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return [ref, isVisible]
}

export default useScrollAnimation
