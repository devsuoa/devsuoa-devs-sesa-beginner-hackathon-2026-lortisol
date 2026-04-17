import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  const [status, setStatus] = useState<string>("Connecting...")

  useEffect(() => {
    // Calling the health check endpoint
    axios.get('http://127.0.0.1:8000/api/health')
      .then(res => setStatus(res.data.message))
      .catch(() => setStatus("Backend Connection Failed"));
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Project Template</h1>
      <div style={{ 
        padding: '1rem', 
        background: status.includes('Failed') ? '#fee2e2' : '#dcfce7',
        borderRadius: '8px' 
      }}>
        <p style={{color:'black'}}>
        Backend Status: <strong>{status}</strong>
        </p>
      </div>
    </div>
  )
}

export default App