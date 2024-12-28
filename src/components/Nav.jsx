import { Link } from 'react-router-dom'

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow z-10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
            LA Service Record
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Nav;