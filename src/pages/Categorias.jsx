import { Link } from 'react-router-dom'
import { useCategorias } from '../hooks/useCategorias'
import { useTitulo } from '../hooks/useTitulo'
import { textoCantidadLibros } from '../utils/formato'
import Cargando from '../components/Cargando'
import MensajeError from '../components/MensajeError'

export default function Categorias() {
  useTitulo('Categorías')
  const { estado, datos, error, reintentar } = useCategorias()

  return (
    <>
      <h1>Categorías de libros</h1>
      {estado === 'cargando' && <Cargando mensaje="Cargando categorías..." />}
      {estado === 'error' && (
        <MensajeError error={error} onReintentar={reintentar}>
          <Link to="/" className="enlace-secundario">
            Ir al inicio
          </Link>
        </MensajeError>
      )}
      {estado === 'listo' && (
        <ul className="grilla">
          {datos.map((c) => (
            <li key={c.id} className="tarjeta-categoria">
              <h2>
                <Link to={`/categorias/${c.id}`}>{c.nombre}</Link>
              </h2>
              <p>{c.descripcion}</p>
              <p className="cantidad">{textoCantidadLibros(c.cantidad)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
