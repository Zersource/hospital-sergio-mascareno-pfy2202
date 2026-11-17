import { formatearPrecio } from '../utils/formato'

export default function TarjetaLibro({ libro }) {
  return (
    <li className="tarjeta-libro">
      <h2>{libro.title}</h2>
      <p className="autor">{libro.author}</p>
      <p className="precio">{formatearPrecio(libro.price)}</p>
    </li>
  )
}
