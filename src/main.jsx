import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './App.css'

// El servidor simulado (MSW) solo se activa en desarrollo, y se espera a que este listo
// antes de dibujar la aplicacion para que ningun pedido se escape al servidor real.
async function enableMocking() {
  if (!import.meta.env.DEV) return undefined
  const { worker } = await import('./mocks/browser')
  return worker.start({ onUnhandledRequest: 'bypass' })
}

function dibujar() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Si el servidor simulado no logra iniciar (por ejemplo, un navegador que bloquea Service Workers),
// la aplicacion igual se dibuja y muestra sus mensajes de error en lugar de quedar en blanco.
enableMocking()
  .catch((error) => console.warn('No se pudo iniciar el servidor simulado (MSW):', error))
  .then(dibujar)
