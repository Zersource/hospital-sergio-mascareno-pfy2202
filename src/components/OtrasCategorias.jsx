import { Link } from 'react-router-dom'

// Atajos a otras categorias: sirven como salida cuando una categoria falla o esta vacia.
export default function OtrasCategorias({ categorias, actual }) {
  const otras = categorias.filter((c) => c.id !== actual)
  if (otras.length === 0) return null
  return (
    <div className="otras-categorias">
      <p>Mientras tanto, puedes explorar otra categoría:</p>
      <ul className="chips">
        {otras.map((c) => (
          <li key={c.id}>
            <Link to={`/categorias/${c.id}`}>{c.nombre}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
