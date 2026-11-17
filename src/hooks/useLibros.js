import { api } from '../api/librosApi'
import { useRecurso } from './useRecurso'

export function useLibros(genero) {
  return useRecurso(genero, (g) => api.obtenerLibros(g), (g) => api.librosEnCache(g))
}
