import PropTypes from 'prop-types'

export function Button({ children, className = '', ...props }) {
  return (
    <button 
      className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${className}`} 
      {...props}
    >
      {children}
    </button>
  )
}

export function Input({ className = '', ...props }) {
  return (
    <input 
      className={`w-full p-2 border rounded-lg ${className}`} 
      {...props}
    />
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      {children}
    </div>
  )
}

// PropTypes
Button.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

Input.propTypes = {
  className: PropTypes.string
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}