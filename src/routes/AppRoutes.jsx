import { Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout'
import Home from '../pages/Home'
import Categorias from '../pages/Categorias'
import LibrosCategoria from '../pages/LibrosCategoria'
import NoEncontrada from '../pages/NoEncontrada'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="categorias" element={<Categorias />} />
        <Route path="categorias/:genero" element={<LibrosCategoria />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
