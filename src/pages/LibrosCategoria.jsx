import { Link, useParams } from 'react-router-dom'
import { useCategorias } from '../hooks/useCategorias'
import { useLibros } from '../hooks/useLibros'
import { useTitulo } from '../hooks/useTitulo'
import Cargando from '../components/Cargando'
import MensajeError from '../components/MensajeError'
import OtrasCategorias from '../components/OtrasCategorias'
import TarjetaLibro from '../components/TarjetaLibro'

export default function LibrosCategoria() {
  const { genero } = useParams()
  const libros = useLibros(genero)
  // Las categorias suelen venir de la cache (si el usuario paso por la lista); si no, se piden una sola vez.
  const categorias = useCategorias()

  const lista = categorias.estado === 'listo' ? categorias.datos : []
  const categoria = lista.find((c) => c.id === genero)
  const nombre = categoria ? categoria.nombre : `Categoría: ${genero}`
  useTitulo(nombre)

  return (
    <>
      <p className="migas">
        <Link to="/categorias">← Todas las categorías</Link>
      </p>
      <h1>{nombre}</h1>
      {categoria && <p className="descripcion">{categoria.descripcion}</p>}

      {libros.estado === 'cargando' && <Cargando mensaje={`Cargando libros de ${categoria ? categoria.nombre : 'la categoría'}...`} />}

      {libros.estado === 'error' && (
        <MensajeError error={libros.error} onReintentar={libros.reintentar}>
          <Link to="/categorias" className="enlace-secundario">
            Ver todas las categorías
          </Link>
          <OtrasCategorias categorias={lista} actual={genero} />
        </MensajeError>
      )}

      {libros.estado === 'listo' && libros.datos.length > 0 && (
        <ul className="grilla">
          {libros.datos.map((libro) => (
            <TarjetaLibro key={libro.id} libro={libro} />
          ))}
        </ul>
      )}

      {libros.estado === 'listo' && libros.datos.length === 0 && (
        <div className="sin-libros">
          <p>Por ahora no hay libros disponibles en esta categoría.</p>
          <OtrasCategorias categorias={lista} actual={genero} />
        </div>
      )}
    </>
  )
}
