// Pruebas de extremo a extremo (navegador real con Playwright) sobre el servidor de desarrollo,
// que es donde se activa el servidor simulado (MSW).
// Uso: npm run test:e2e   (opcional: VOLCAR_HTML=carpeta guarda el HTML renderizado; CAPTURAS=carpeta guarda imagenes)
let chromium
try { ({ chromium } = await import('playwright')) } catch {
  const { createRequire } = await import('node:module')
  const { execSync } = await import('node:child_process')
  ;({ chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright'))
}
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const PUERTO = 5199
const base = `http://localhost:${PUERTO}`
const srv = spawn('npx', ['vite', '--port', String(PUERTO), '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 60; i++) {
  try { await fetch(base); break } catch { await new Promise((r) => setTimeout(r, 250)) }
}

let ok = 0, fail = 0
const check = (cond, msg) => { cond ? ok++ : fail++; console.log((cond ? 'OK   ' : 'FALLA') + ' ' + msg) }

const volcarHtml = process.env.VOLCAR_HTML
const capturas = process.env.CAPTURAS
if (volcarHtml) mkdirSync(volcarHtml, { recursive: true })
if (capturas) mkdirSync(capturas, { recursive: true })

const browser = await chromium.launch()
const estado = '[role="status"]'
const alerta = '[role="alert"]'
const tarjetas = 'main ul.grilla > li'

async function volcar(page, nombre) {
  if (volcarHtml) writeFileSync(`${volcarHtml}/${nombre}.html`, '<!DOCTYPE html>\n' + (await page.evaluate(() => document.documentElement.outerHTML)))
}
async function foto(page, nombre) {
  if (capturas) await page.screenshot({ path: `${capturas}/${nombre}.png`, fullPage: true })
}

for (const [nombre, w, h] of [['360', 360, 780], ['390', 390, 844], ['768', 768, 1024], ['desktop', 1366, 800]]) {
  console.log(`\n=== Ancho ${nombre} ===`)
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  const errores = []
  const pedidos = []
  page.on('pageerror', (e) => errores.push(e.message))
  // Los 404 y 500 que el mock devuelve a proposito aparecen como "Failed to load resource": no son fallas de la app
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errores.push(m.text()))
  page.on('request', (r) => /\/api\/(categories|books)/.test(r.url()) && pedidos.push(new URL(r.url()).pathname + new URL(r.url()).search))
  const cuenta = (ruta) => pedidos.filter((p) => p === ruta).length

  // ---- Inicio: no pide nada al servidor
  await page.goto(base + '/')
  await page.waitForSelector('h1')
  check((await page.locator('h1').innerText()) === 'Bienvenido a Librería Páginas', 'Inicio muestra el titulo')
  check(pedidos.length === 0, 'El inicio no hace pedidos a la API (solo carga lo necesario)')
  check((await page.locator('nav[aria-label="Menú principal"] a').count()) === 2, 'Menu principal con 2 enlaces')
  await volcar(page, `inicio-${nombre}`)

  // ---- Categorias: indicador de carga y luego la lista
  await page.getByRole('link', { name: 'Categorías', exact: true }).click()
  await page.waitForSelector(estado)
  check((await page.locator(estado).innerText()) === 'Cargando categorías...', 'Muestra "Cargando categorías..." mientras espera')
  if (nombre === '390') await foto(page, 'categorias-cargando')
  await page.waitForSelector(tarjetas)
  check((await page.locator(estado).count()) === 0, 'El indicador de carga desaparece al llegar las categorias')
  check((await page.locator(tarjetas).count()) === 5, 'Lista las 5 categorias que entrega el mock')
  const nombres = await page.locator(`${tarjetas} h2`).allInnerTexts()
  check(nombres.join('|') === 'Ficción|Ciencia Ficción|Fantasía|Drama|Poesía', 'Nombres de categorias correctos: ' + nombres.join(', '))
  check((await page.locator(tarjetas).nth(0).innerText()).includes('4 libros'), 'Cada categoria informa su cantidad de libros')
  check((await page.locator(tarjetas).nth(3).innerText()).includes('Sin libros por ahora'), 'Drama indica que no tiene libros')
  check(cuenta('/api/categories') === 1, 'Se hizo 1 pedido de categorias (aun con StrictMode)')
  await volcar(page, `categorias-${nombre}`)
  if (nombre === '390' || nombre === 'desktop') await foto(page, `categorias-${nombre}`)

  // ---- Cache: ir al inicio y volver no repite el pedido ni muestra el indicador
  await page.getByRole('link', { name: 'Inicio', exact: true }).click()
  await page.getByRole('link', { name: 'Categorías', exact: true }).click()
  await page.waitForSelector(tarjetas)
  check((await page.locator(estado).count()) === 0, 'Al volver a Categorias aparecen al instante (sin indicador)')
  check(cuenta('/api/categories') === 1, 'Volver a Categorias NO repite el pedido (cache)')

  // ---- Libros de una categoria (con las categorias ya en cache)
  await page.getByRole('link', { name: 'Ficción', exact: true }).click()
  await page.waitForSelector(estado)
  check((await page.locator(estado).innerText()) === 'Cargando libros de Ficción...', 'Muestra "Cargando libros de Ficción..."')
  check((await page.locator('h1').innerText()) === 'Ficción', 'El titulo muestra el nombre de la categoria mientras carga')
  if (nombre === '390') await foto(page, 'libros-cargando')
  await page.waitForSelector(tarjetas)
  check((await page.locator(estado).count()) === 0, 'El indicador desaparece al llegar los libros')
  check((await page.locator(tarjetas).count()) === 4, 'Ficcion lista 4 libros')
  const t0 = await page.locator(tarjetas).nth(0).innerText()
  check(t0.includes('Cien años de soledad') && t0.includes('Gabriel García Márquez') && /\$\s?14\.500/.test(t0), 'Libro con titulo, autor y precio en pesos: ' + t0.replace(/\n+/g, ' | '))
  check(cuenta('/api/books?genre=ficcion') === 1, 'Un solo pedido de libros para Ficcion')
  await volcar(page, `libros-${nombre}`)
  if (nombre === '390' || nombre === 'desktop') await foto(page, `libros-${nombre}`)

  // ---- Volver a una categoria ya vista: sin indicador y sin pedido nuevo
  await page.getByRole('link', { name: '← Todas las categorías' }).click()
  await page.getByRole('link', { name: 'Ficción', exact: true }).click()
  await page.waitForSelector(tarjetas)
  check((await page.locator(estado).count()) === 0, 'Ficcion ya vista: aparece al instante')
  check(cuenta('/api/books?genre=ficcion') === 1, 'Volver a Ficcion NO repite el pedido (cache)')

  // ---- Cambio rapido de categoria: no queda contenido de la anterior
  await page.getByRole('link', { name: '← Todas las categorías' }).click()
  await page.getByRole('link', { name: 'Ciencia Ficción', exact: true }).click()
  await page.getByRole('link', { name: '← Todas las categorías' }).click()
  await page.getByRole('link', { name: 'Fantasía', exact: true }).click()
  await page.waitForSelector(tarjetas)
  await page.waitForTimeout(1500) // da tiempo a que llegue la respuesta atrasada de Ciencia Ficcion
  const titulos = await page.locator(`${tarjetas} h2`).allInnerTexts()
  check(titulos.length === 3 && titulos[0] === 'El hobbit', 'Cambio rapido de categoria: se ve solo Fantasia (' + titulos.join(', ') + ')')

  // ---- Categoria sin libros
  await page.getByRole('link', { name: '← Todas las categorías' }).click()
  await page.getByRole('link', { name: 'Drama', exact: true }).click()
  await page.waitForSelector('.sin-libros')
  check((await page.locator('.sin-libros').innerText()).includes('no hay libros disponibles'), 'Drama muestra el aviso de categoria sin libros')
  check((await page.locator('.sin-libros a').count()) === 4, 'El aviso ofrece las otras 4 categorias como salida')
  await volcar(page, `vacio-${nombre}`)

  // ---- Error 500 + reintento (Poesia falla la primera vez)
  await page.getByRole('link', { name: '← Todas las categorías' }).click()
  await page.getByRole('link', { name: 'Poesía', exact: true }).click()
  await page.waitForSelector(alerta)
  check((await page.locator(alerta).locator('h2').innerText()) === 'El servidor tuvo un problema', 'Error 500: titulo claro')
  check((await page.locator(alerta).innerText()).includes('intenta de nuevo'), 'Error 500: explica que es pasajero')
  check((await page.locator(estado).count()) === 0, 'Con el error ya no queda indicador de carga')
  check((await page.getByRole('button', { name: 'Reintentar' }).count()) === 1, 'Error 500: ofrece Reintentar')
  check((await page.locator(`${alerta} .chips a`).count()) === 4, 'Error 500: ofrece las otras categorias como alternativa')
  await volcar(page, `error500-${nombre}`)
  if (nombre === '390' || nombre === 'desktop') await foto(page, `error500-${nombre}`)
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await page.waitForSelector(estado)
  check((await page.locator(alerta).count()) === 0, 'Al reintentar desaparece el mensaje de error y vuelve el indicador')
  await page.waitForSelector(tarjetas)
  check((await page.locator(tarjetas).count()) === 3, 'El reintento carga los 3 libros de Poesia')
  check(cuenta('/api/books?genre=poesia') === 2, 'Poesia: 2 pedidos en total (el fallido y el reintento)')

  // ---- Error 404: categoria que no existe (entrando directo por URL)
  await page.goto(base + '/categorias/terror')
  await page.waitForSelector(alerta)
  check((await page.locator(alerta).locator('h2').innerText()) === 'No encontramos lo que buscas', 'Error 404: titulo claro')
  check((await page.locator(alerta).innerText()).includes('La categoría "terror" no existe.'), 'Error 404: usa el mensaje del servidor')
  check((await page.getByRole('button', { name: 'Reintentar' }).count()) === 0, 'Error 404: NO ofrece Reintentar (no tiene sentido)')
  check((await page.getByRole('link', { name: 'Ver todas las categorías' }).count()) === 1, 'Error 404: ofrece volver a las categorias')
  await volcar(page, `error404-${nombre}`)

  // ---- Entrada directa a una categoria valida: pide categorias y libros en paralelo
  await page.goto(base + '/categorias/ciencia-ficcion')
  await page.waitForSelector(tarjetas)
  check((await page.locator('h1').innerText()) === 'Ciencia Ficción', 'Entrada directa: el titulo usa el nombre de la categoria')
  check((await page.locator(tarjetas).count()) === 4, 'Entrada directa: lista los 4 libros')

  // ---- Ruta inexistente
  await page.goto(base + '/no-existe')
  await page.waitForSelector('h1')
  check((await page.locator('h1').innerText()) === 'Página no encontrada', 'Ruta inexistente muestra la pagina 404')
  await volcar(page, `noencontrada-${nombre}`)

  // ---- Sin desborde horizontal y sin errores de consola
  for (const ruta of ['/', '/categorias', '/categorias/fantasia']) {
    await page.goto(base + ruta)
    await page.waitForSelector('h1')
    await page.waitForTimeout(1300)
    const desborda = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    check(!desborda, `Sin desborde horizontal en ${ruta}`)
  }
  check(errores.length === 0, 'Sin errores de JavaScript ni de consola' + (errores.length ? ': ' + errores.join(' / ') : ''))
  await page.close()
}

// ---- Falla de red real (sin Service Worker): el pedido se aborta y despues se recupera
console.log('\n=== Falla de red ===')
{
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.route('**/api/categories', (r) => r.abort('connectionfailed'))
  await page.goto(base + '/categorias')
  await page.waitForSelector(alerta)
  check((await page.locator(alerta).locator('h2').innerText()) === 'No pudimos conectar con el servidor', 'Falla de red: titulo claro')
  check((await page.locator(alerta).innerText()).includes('Revisa tu internet'), 'Falla de red: indica revisar la conexion')
  await foto(page, 'error-red-390')
  await page.unroute('**/api/categories')
  await page.route('**/api/categories', (r) => r.fulfill({ json: [{ id: 'ficcion', nombre: 'Ficción', descripcion: 'x', cantidad: 2 }] }))
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await page.waitForSelector(tarjetas)
  check((await page.locator(tarjetas).count()) === 1 && (await page.locator(alerta).count()) === 0, 'Falla de red: al reintentar con conexion se recupera')
  await ctx.close()
}

// ---- Respuesta que no es JSON (por ejemplo, un servidor mal configurado)
{
  const ctx = await browser.newContext({ serviceWorkers: 'block' })
  const page = await ctx.newPage()
  await page.route('**/api/categories', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<html>hola</html>' }))
  await page.goto(base + '/categorias')
  await page.waitForSelector(alerta)
  check((await page.locator(alerta).locator('h2').innerText()) === 'Recibimos datos que no pudimos leer', 'Respuesta invalida: titulo claro')
  await ctx.close()
}

await browser.close()
srv.kill()
console.log(`\n${ok} correctas, ${fail} fallas`)
process.exit(fail ? 1 : 0)
