// Cliente de la API REST (simulada con MSW) de la libreria.
// Concentra tres cosas para que los componentes no repitan logica:
//   1. Traduce cada falla (red, tiempo, 404, 500, respuesta invalida) a un error con mensaje claro.
//   2. Guarda en memoria lo que ya se descargo, para no repetir pedidos al volver a una pantalla.
//   3. Si dos componentes piden lo mismo a la vez, hace un solo pedido y comparte el resultado.

export class ErrorApi extends Error {
  // tipo: 'red' | 'tiempo' | 'no-encontrado' | 'servidor' | 'solicitud' | 'respuesta'
  constructor(tipo, titulo, mensaje, { status = null } = {}) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.tipo = tipo
    this.titulo = titulo
    this.status = status
    // Si el problema es pasajero tiene sentido ofrecer "Reintentar"; si el recurso no existe, no.
    this.reintentable = tipo === 'red' || tipo === 'tiempo' || tipo === 'servidor' || tipo === 'respuesta'
  }
}

async function leerMensajeDelServidor(respuesta) {
  try {
    const cuerpo = await respuesta.json()
    return typeof cuerpo?.message === 'string' ? cuerpo.message : ''
  } catch {
    return ''
  }
}

async function errorDeEstado(respuesta) {
  const { status } = respuesta
  const detalle = await leerMensajeDelServidor(respuesta)
  if (status === 404) {
    return new ErrorApi('no-encontrado', 'No encontramos lo que buscas',
      detalle || 'El recurso solicitado no existe.', { status })
  }
  if (status >= 500) {
    return new ErrorApi('servidor', 'El servidor tuvo un problema',
      'No pudimos completar la solicitud por un fallo del servidor. Suele ser pasajero: intenta de nuevo en unos segundos.', { status })
  }
  return new ErrorApi('solicitud', 'No pudimos procesar la solicitud',
    detalle || `El servidor rechazó la solicitud (código ${status}).`, { status })
}

export function crearClienteApi({ fetchFn = (...args) => fetch(...args), tiempoMaximoMs = 8000 } = {}) {
  const cache = new Map() // url -> datos ya descargados
  const enCurso = new Map() // url -> promesa del pedido que esta en vuelo

  async function ejecutar(url, validar) {
    let respuesta
    try {
      respuesta = await fetchFn(url, { signal: AbortSignal.timeout(tiempoMaximoMs) })
    } catch (e) {
      if (e?.name === 'TimeoutError' || e?.name === 'AbortError') {
        throw new ErrorApi('tiempo', 'El servidor tardó demasiado',
          'La respuesta no llegó a tiempo. Revisa tu conexión e intenta de nuevo.')
      }
      throw new ErrorApi('red', 'No pudimos conectar con el servidor',
        'Parece que no hay conexión. Revisa tu internet e intenta de nuevo.')
    }
    if (!respuesta.ok) throw await errorDeEstado(respuesta)

    let datos
    try {
      datos = await respuesta.json()
    } catch {
      datos = undefined
    }
    if (!validar(datos)) {
      throw new ErrorApi('respuesta', 'Recibimos datos que no pudimos leer',
        'El servidor respondió, pero con un formato inesperado. Intenta de nuevo.')
    }
    return datos
  }

  function pedir(url, validar) {
    if (cache.has(url)) return Promise.resolve(cache.get(url))
    if (enCurso.has(url)) return enCurso.get(url)
    const promesa = ejecutar(url, validar)
      .then((datos) => {
        cache.set(url, datos) // solo se guardan los pedidos exitosos: una falla se puede reintentar
        return datos
      })
      .finally(() => enCurso.delete(url))
    enCurso.set(url, promesa)
    return promesa
  }

  const urlCategorias = '/api/categories'
  const urlLibros = (genero) => `/api/books?genre=${encodeURIComponent(genero)}`
  const esLista = (datos) => Array.isArray(datos)

  return {
    obtenerCategorias: () => pedir(urlCategorias, esLista),
    obtenerLibros: (genero) => pedir(urlLibros(genero), esLista),
    categoriasEnCache: () => cache.get(urlCategorias),
    librosEnCache: (genero) => cache.get(urlLibros(genero)),
    limpiarCache: () => cache.clear(),
  }
}

// Instancia unica que usa la aplicacion.
export const api = crearClienteApi()
