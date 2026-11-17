const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export const formatearPrecio = (valor) => pesos.format(valor)

export const textoCantidadLibros = (n) =>
  n === 0 ? 'Sin libros por ahora' : n === 1 ? '1 libro' : `${n} libros`
