// Indicador de carga: se muestra mientras hay un pedido en curso y desaparece al llegar los datos o un error.
export default function Cargando({ mensaje }) {
  return (
    <div className="cargando" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{mensaje}</p>
    </div>
  )
}
