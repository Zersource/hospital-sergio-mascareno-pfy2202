// Pruebas unitarias del cliente de la API (sin navegador): errores, cache y pedidos duplicados.
// Uso: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { crearClienteApi, ErrorApi } from '../src/api/librosApi.js'

const json = (cuerpo, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } })

// fetch falso que devuelve las respuestas en orden y cuenta los pedidos
function fetchFalso(...respuestas) {
  const f = async (url) => {
    f.pedidos.push(url)
    const r = respuestas[Math.min(f.pedidos.length - 1, respuestas.length - 1)]
    if (r instanceof Error) throw r
    return typeof r === 'function' ? r() : r.clone()
  }
  f.pedidos = []
  return f
}

const categorias = [{ id: 'ficcion', nombre: 'Ficción', descripcion: 'x', cantidad: 1 }]
const libros = [{ id: 1, title: 'Dune', author: 'Frank Herbert', price: 16500 }]

test('pide las categorias una sola vez y la segunda sale de la cache', async () => {
  const f = fetchFalso(json(categorias))
  const api = crearClienteApi({ fetchFn: f })
  assert.equal(api.categoriasEnCache(), undefined)
  assert.deepEqual(await api.obtenerCategorias(), categorias)
  assert.deepEqual(await api.obtenerCategorias(), categorias)
  assert.equal(f.pedidos.length, 1)
  assert.deepEqual(api.categoriasEnCache(), categorias)
  assert.equal(f.pedidos[0], '/api/categories')
})

test('dos pedidos simultaneos de lo mismo hacen un solo fetch', async () => {
  const f = fetchFalso(json(libros))
  const api = crearClienteApi({ fetchFn: f })
  const [a, b] = await Promise.all([api.obtenerLibros('fantasia'), api.obtenerLibros('fantasia')])
  assert.deepEqual(a, libros)
  assert.deepEqual(b, libros)
  assert.equal(f.pedidos.length, 1)
})

test('cada categoria tiene su propia cache y la consulta va codificada', async () => {
  const f = fetchFalso(json(libros))
  const api = crearClienteApi({ fetchFn: f })
  await api.obtenerLibros('ficcion')
  await api.obtenerLibros('ciencia-ficcion')
  await api.obtenerLibros('ficcion')
  assert.deepEqual(f.pedidos, ['/api/books?genre=ficcion', '/api/books?genre=ciencia-ficcion'])
  assert.equal(api.librosEnCache('otra'), undefined)
  await api.obtenerLibros('a b&c').catch(() => {})
  assert.equal(f.pedidos.at(-1), '/api/books?genre=a%20b%26c')
})

test('404: error "no-encontrado" con el mensaje del servidor, sin reintento y sin guardar en cache', async () => {
  const f = fetchFalso(json({ message: 'La categoría "terror" no existe.' }, 404))
  const api = crearClienteApi({ fetchFn: f })
  const error = await api.obtenerLibros('terror').catch((e) => e)
  assert.ok(error instanceof ErrorApi)
  assert.equal(error.tipo, 'no-encontrado')
  assert.equal(error.status, 404)
  assert.equal(error.message, 'La categoría "terror" no existe.')
  assert.equal(error.reintentable, false)
  assert.equal(api.librosEnCache('terror'), undefined)
})

test('500: error "servidor" reintentable; la falla no se guarda y el reintento funciona', async () => {
  const f = fetchFalso(json({ message: 'Error interno del servidor.' }, 500), json(libros))
  const api = crearClienteApi({ fetchFn: f })
  const error = await api.obtenerLibros('poesia').catch((e) => e)
  assert.equal(error.tipo, 'servidor')
  assert.equal(error.status, 500)
  assert.equal(error.reintentable, true)
  assert.match(error.message, /intenta de nuevo/i)
  assert.equal(api.librosEnCache('poesia'), undefined)
  assert.deepEqual(await api.obtenerLibros('poesia'), libros)
  assert.equal(f.pedidos.length, 2)
  assert.deepEqual(api.librosEnCache('poesia'), libros)
})

test('400: error "solicitud" con el mensaje del servidor', async () => {
  const api = crearClienteApi({ fetchFn: fetchFalso(json({ message: 'Falta indicar la categoría.' }, 400)) })
  const error = await api.obtenerLibros('').catch((e) => e)
  assert.equal(error.tipo, 'solicitud')
  assert.equal(error.message, 'Falta indicar la categoría.')
  assert.equal(error.reintentable, false)
})

test('falla de red (fetch lanza TypeError): error "red" reintentable', async () => {
  const api = crearClienteApi({ fetchFn: fetchFalso(new TypeError('Failed to fetch')) })
  const error = await api.obtenerCategorias().catch((e) => e)
  assert.equal(error.tipo, 'red')
  assert.equal(error.reintentable, true)
  assert.match(error.message, /conexión/i)
})

test('tiempo agotado: error "tiempo" cuando el servidor no responde', async () => {
  const sinRespuesta = (url, { signal }) =>
    new Promise((_, rechazar) => signal.addEventListener('abort', () => rechazar(signal.reason)))
  const api = crearClienteApi({ fetchFn: sinRespuesta, tiempoMaximoMs: 40 })
  // En Node el temporizador de AbortSignal.timeout no mantiene vivo el proceso: se mantiene vivo a mano.
  const mantenerVivo = setTimeout(() => {}, 1000)
  const error = await api.obtenerCategorias().catch((e) => e)
  clearTimeout(mantenerVivo)
  assert.equal(error.tipo, 'tiempo')
  assert.equal(error.reintentable, true)
})

test('respuesta con formato inesperado: error "respuesta"', async () => {
  const api1 = crearClienteApi({ fetchFn: fetchFalso(new Response('<html>no es json</html>', { status: 200 })) })
  assert.equal((await api1.obtenerCategorias().catch((e) => e)).tipo, 'respuesta')
  const api2 = crearClienteApi({ fetchFn: fetchFalso(json({ no: 'es una lista' })) })
  assert.equal((await api2.obtenerLibros('ficcion').catch((e) => e)).tipo, 'respuesta')
})

test('limpiarCache obliga a pedir de nuevo', async () => {
  const f = fetchFalso(json(categorias))
  const api = crearClienteApi({ fetchFn: f })
  await api.obtenerCategorias()
  api.limpiarCache()
  await api.obtenerCategorias()
  assert.equal(f.pedidos.length, 2)
})
