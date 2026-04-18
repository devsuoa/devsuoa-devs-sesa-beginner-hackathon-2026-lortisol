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
    <div className="p-2 font-[Orbitron] text-3xl bg-amber-400">
      <h1>Project Template</h1>
      
        <p style={{color:'black'}}>
        Backend Status: <strong>{status}</strong>
        </p>
    </div>
  )
}

export default App