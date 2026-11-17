import { http, HttpResponse, delay } from 'msw'
import { categorias, librosPorGenero } from './datos'

// Conteo de pedidos a "poesia" para simular una falla pasajera del servidor:
// la primera vez responde 500 y desde el segundo intento responde bien (se reinicia al recargar la pagina).
let pedidosPoesia = 0

export const handlers = [
  // GET /api/categories -> lista de categorias (con la cantidad de libros de cada una)
  http.get('/api/categories', async () => {
    await delay(800)
    const lista = categorias.map((c) => ({ ...c, cantidad: librosPorGenero[c.id].length }))
    return HttpResponse.json(lista)
  }),

  // GET /api/books?genre=<id> -> libros de una categoria
  http.get('/api/books', async (req) => {
    const genre = new URL(req.request.url).searchParams.get('genre')

    // Retraso simulado de 1 segundo, como en la guia
    await delay(1000)

    if (!genre) {
      return HttpResponse.json({ message: 'Falta indicar la categoría (parámetro genre).' }, { status: 400 })
    }

    const books = librosPorGenero[genre]
    if (!books) {
      return HttpResponse.json({ message: `La categoría "${genre}" no existe.` }, { status: 404 })
    }

    if (genre === 'poesia') {
      pedidosPoesia += 1
      if (pedidosPoesia === 1) {
        return HttpResponse.json({ message: 'Error interno del servidor.' }, { status: 500 })
      }
    }

    return HttpResponse.json(books)
  }),
]
