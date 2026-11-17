import { useEffect, useState } from 'react'

// Estado de un pedido: 'cargando' | 'listo' | 'error'.
// - Si el dato ya esta en cache arranca en 'listo' (sin mostrar el indicador de carga ni repetir el pedido).
// - Si cambia la clave (por ejemplo, otra categoria) vuelve a pedir solo lo que falta.
// - Ignora respuestas atrasadas de una clave anterior o de un componente ya desmontado.
function estadoInicial(clave, leerCache) {
  const guardado = leerCache(clave)
  return guardado !== undefined
    ? { clave, estado: 'listo', datos: guardado, error: null }
    : { clave, estado: 'cargando', datos: null, error: null }
}

export function useRecurso(clave, cargar, leerCache) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(() => estadoInicial(clave, leerCache))

  useEffect(() => {
    let vigente = true
    const guardado = leerCache(clave)
    if (guardado !== undefined) {
      setResultado((previo) =>
        previo.clave === clave && previo.estado === 'listo'
          ? previo
          : { clave, estado: 'listo', datos: guardado, error: null })
      return undefined
    }
    setResultado({ clave, estado: 'cargando', datos: null, error: null })
    cargar(clave)
      .then((datos) => vigente && setResultado({ clave, estado: 'listo', datos, error: null }))
      .catch((error) => vigente && setResultado({ clave, estado: 'error', datos: null, error }))
    return () => {
      vigente = false
    }
    // cargar y leerCache son funciones estables del cliente de la API
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, intento])

  // Mientras el efecto aun no corre para una clave nueva, se muestra el estado correcto sin parpadeos.
  const actual = resultado.clave === clave ? resultado : estadoInicial(clave, leerCache)
  return { ...actual, reintentar: () => setIntento((n) => n + 1) }
}
