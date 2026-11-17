import { Link } from 'react-router-dom'
import { useTitulo } from '../hooks/useTitulo'

export default function Home() {
  useTitulo('Inicio')
  return (
    <div className="portada">
      <h1>Bienvenido a Librería Páginas</h1>
      <p>
        Explora nuestros libros por categoría. La lista de categorías y los libros de cada una se piden a una
        API REST simulada, así que verás cómo cargan y cómo responde el sitio cuando algo falla.
      </p>
      <Link to="/categorias" className="boton">
        Explorar categorías
      </Link>
    </div>
  )
}
