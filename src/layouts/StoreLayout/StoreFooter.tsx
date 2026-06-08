import { Link } from 'react-router-dom'

export function StoreFooter() {
  return (
    <footer className="bg-secondary-900 text-secondary-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="text-2xl font-bold text-white">Chipo</span>
            <p className="mt-3 text-sm leading-relaxed">
              Tu tienda de confianza para encontrar todo lo que necesitás.
            </p>
          </div>

          {/* Tienda */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Tienda</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/catalog" className="hover:text-white transition-colors">Catálogo</Link></li>
              <li><Link to="/catalog?new=true" className="hover:text-white transition-colors">Novedades</Link></li>
              <li><Link to="/catalog?discount=true" className="hover:text-white transition-colors">Ofertas</Link></li>
            </ul>
          </div>

          {/* Mi cuenta */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Mi cuenta</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/account" className="hover:text-white transition-colors">Mi perfil</Link></li>
              <li><Link to="/account/orders" className="hover:text-white transition-colors">Mis pedidos</Link></li>
              <li><Link to="/account/favorites" className="hover:text-white transition-colors">Favoritos</Link></li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Ayuda</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Envíos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Devoluciones</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-700 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} Chipo. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
