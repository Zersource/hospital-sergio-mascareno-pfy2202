import { api } from '../api/librosApi'
import { useRecurso } from './useRecurso'

const CLAVE = 'categorias'

export function useCategorias() {
  return useRecurso(CLAVE, () => api.obtenerCategorias(), () => api.categoriasEnCache())
}
