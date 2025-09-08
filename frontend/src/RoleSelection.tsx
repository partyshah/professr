import { Link } from 'react-router-dom'
import professrLogo from './assets/Professr Logo.png'

function RoleSelection() {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#f5f5f5',
      padding: '2rem',
      margin: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      boxSizing: 'border-box'
    }}>
      {/* Main content area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center'
      }}>
        <h1 style={{ 
          marginBottom: '60px',
          fontSize: '2.5rem',
          fontWeight: '600',
          color: '#333'
        }}>
          You are a...
        </h1>
        
        <div style={{
          display: 'flex',
          gap: '2rem',
          flexDirection: 'row'
        }}>
          <Link 
            to="/instructor"
            style={{
              padding: '2.5rem 5rem',
              fontSize: '1.8rem',
              fontWeight: '600',
              backgroundColor: 'white',
              color: '#333',
              border: 'none',
              borderRadius: '30px',
              textDecoration: 'none',
              minWidth: '250px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            Professor
          </Link>
          
          <Link 
            to="/student"
            style={{
              padding: '2.5rem 5rem',
              fontSize: '1.8rem',
              fontWeight: '600',
              backgroundColor: 'white',
              color: '#333',
              border: 'none',
              borderRadius: '30px',
              textDecoration: 'none',
              minWidth: '250px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            Student
          </Link>
        </div>
      </div>

      {/* Professr Logo at bottom */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem'
      }}>
        <img 
          src={professrLogo} 
          alt="Professr Logo" 
          style={{
            height: '60px',
            width: 'auto'
          }}
        />
        <span style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#333'
        }}>
          Professr
        </span>
      </div>
    </div>
  )
}

export default RoleSelection
