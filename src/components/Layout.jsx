import { NavLink, Link, Outlet } from 'react-router-dom'

const claseEnlace = ({ isActive }) => (isActive ? 'activo' : undefined)

export default function Layout() {
  return (
    <div className="sitio">
      <header className="encabezado">
        <div className="contenedor encabezado-interior">
          <Link to="/" className="marca">
            Librería Páginas
          </Link>
          <nav aria-label="Menú principal">
            <ul className="menu">
              <li>
                <NavLink to="/" end className={claseEnlace}>
                  Inicio
                </NavLink>
              </li>
              <li>
                <NavLink to="/categorias" className={claseEnlace}>
                  Categorías
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="contenedor principal">
        <Outlet />
      </main>
      <footer className="pie">
        <div className="contenedor">
          <p>Datos de ejemplo entregados por una API REST simulada con MSW.</p>
        </div>
      </footer>
    </div>
  )
}
