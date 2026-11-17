# Librería Páginas - Categorías de libros

Actividad formativa S4 - "Utilizando tecnologías de integración entre frontend y backend", Desarrollo Frontend II (PFY2202), Duoc UC.
Autor: Sergio Mascareno.

- Repositorio: https://github.com/Zersource/hospital-sergio-mascareno-pfy2202

## Descripción

Tienda de libros hecha con HTML, CSS, JavaScript y React 19 (con Vite y React Router 6) donde el usuario explora los libros por categoría.
Los datos no están escritos en el código de la aplicación: los entrega una **API REST simulada (mock) con MSW 2** y el frontend los consume con `fetch`.

## Cómo ejecutarlo

```bash
npm install
npm start
```

Se abre en `http://localhost:5173`. El servidor simulado (MSW) **solo se activa en desarrollo** (`npm start`), como indica la guía; por eso la versión
compilada con `npm run build` no trae datos. Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm test` | Pruebas unitarias del cliente de la API (errores, caché y pedidos duplicados) |
| `npm run test:e2e` | Pruebas en navegador real con Playwright (necesita Playwright instalado en el equipo) |
| `npm run build` | Compila el sitio en `dist/` |

## Páginas (React Router)

| Ruta | Página | Pedido a la API |
|---|---|---|
| `/` | Inicio | Ninguno |
| `/categorias` | Lista de categorías | `GET /api/categories` |
| `/categorias/:genero` | Libros de una categoría | `GET /api/books?genre=<genero>` (y las categorías, que normalmente ya están en caché) |
| `*` | Página no encontrada | Ninguno |

## API REST simulada (`src/mocks`)

| Archivo | Contenido |
|---|---|
| `handlers.js` | Los handlers de MSW: `GET /api/categories` y `GET /api/books?genre=...`, con retraso simulado (`delay`) |
| `browser.js` | `setupWorker(...handlers)` |
| `datos.js` | Categorías y libros de ejemplo (título, autor y precio) |
| `public/mockServiceWorker.js` | Service Worker generado con `npx msw init public` |

Respuestas que simula el servidor:

| Situación | Respuesta | Cómo verla |
|---|---|---|
| Categorías | `200` con la lista (id, nombre, descripción y cantidad de libros) | Menú **Categorías** |
| Libros de una categoría | `200` con la lista, tras 1 segundo | Abrir **Ficción**, **Ciencia Ficción** o **Fantasía** |
| Categoría sin libros | `200` con una lista vacía | Abrir **Drama** |
| Falla del servidor | `500` | Abrir **Poesía**: falla la primera vez y funciona al pulsar **Reintentar** |
| Categoría que no existe | `404` | Abrir `http://localhost:5173/categorias/terror` |
| Falta el parámetro `genre` | `400` | `GET /api/books` sin parámetro |

## Cómo se cubre cada criterio de la pauta

| Criterio | Qué se hizo | Dónde está |
|---|---|---|
| 1. Creación e integración de un mock REST | MSW con dos endpoints; el frontend los consume con `fetch` y muestra los datos. El mock se activa antes de dibujar la aplicación | `src/mocks/*`, `src/main.jsx`, `src/api/librosApi.js` |
| 2. Manejo de errores en las peticiones | Cada falla (sin conexión, tiempo agotado, 404, 500, otros códigos y respuesta ilegible) se traduce a un mensaje específico. Salidas para el usuario: **Reintentar** (solo cuando tiene sentido), enlace a todas las categorías y atajos a otras categorías | `ErrorApi` en `src/api/librosApi.js`, `src/components/MensajeError.jsx`, `src/components/OtrasCategorias.jsx` |
| 3. Control de carga y estado de las peticiones | Cada pedido tiene su estado `cargando` / `listo` / `error`. Se muestra un indicador con mensaje ("Cargando categorías...", "Cargando libros de Ficción...") que se retira al llegar los datos o un error, y reaparece al reintentar | `src/hooks/useRecurso.js`, `src/components/Cargando.jsx` |
| 4. Optimización y eficiencia en la consulta de datos | Caché en memoria: volver a una pantalla ya vista no repite el pedido ni muestra el indicador. Si dos componentes piden lo mismo a la vez se hace un solo `fetch` (también con `StrictMode`). Los libros se piden solo al abrir la categoría y el inicio no pide nada. Las fallas no se guardan, para poder reintentar. Se ignoran las respuestas atrasadas al cambiar de categoría rápido. Cada pedido tiene un tiempo máximo de 8 segundos | `pedir()` en `src/api/librosApi.js`, `src/hooks/useRecurso.js` |

## Estructura del proyecto

```
public/mockServiceWorker.js
src/
  api/librosApi.js          Cliente REST: errores, caché y pedidos duplicados
  mocks/                    handlers.js, browser.js y datos.js (servidor simulado)
  hooks/                    useRecurso, useCategorias, useLibros, useTitulo
  components/               Layout, Cargando, MensajeError, OtrasCategorias, TarjetaLibro
  pages/                    Home, Categorias, LibrosCategoria, NoEncontrada
  routes/AppRoutes.jsx      Rutas con React Router
  utils/formato.js          Precio en pesos chilenos y texto de cantidad
  App.jsx, App.css, main.jsx
pruebas/
  api.test.mjs              Pruebas unitarias
  e2e.mjs                   Pruebas en navegador
```

## Requerimientos de la actividad

| Requerimiento | Dónde está |
|---|---|
| Aplicación de tienda de libros con HTML, JavaScript, CSS y React | Todo el proyecto; los estilos están en `src/App.css` (CSS propio) |
| Listar las categorías de libros desde una API REST mock | `GET /api/categories` en `src/mocks/handlers.js`, mostrado en `src/pages/Categorias.jsx` |
| Navegación con React Router | `src/routes/AppRoutes.jsx` y el menú de `src/components/Layout.jsx` |
| Repositorio `hospital-nombre-apellido-siglaCurso` en GitHub | `hospital-sergio-mascareno-pfy2202` |
