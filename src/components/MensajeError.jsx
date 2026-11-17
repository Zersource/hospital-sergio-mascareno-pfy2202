// Mensaje de error claro para el usuario. Ofrece "Reintentar" solo cuando tiene sentido
// y deja espacio (children) para otras salidas, como ir a otra categoria.
export default function MensajeError({ error, onReintentar, children }) {
  return (
    <div className="mensaje-error" role="alert">
      <h2>{error.titulo}</h2>
      <p>{error.message}</p>
      <div className="acciones">
        {error.reintentable && (
          <button type="button" className="boton" onClick={onReintentar}>
            Reintentar
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
