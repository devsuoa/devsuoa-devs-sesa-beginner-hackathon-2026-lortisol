import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const navigate = useNavigate()
  const [volume, setVolume] = useState(50)
  const [study, setStudy] = useState(25)
  const [rest, setRest] = useState(5)

  return (
    <div>
      <button onClick={() => navigate('/')}>← Back</button>

      <h2>Settings</h2>

      <div>
        <label>Music Volume</label>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={e => setVolume(parseInt(e.target.value))}
        />
        <span>{volume}%</span>
      </div>

      <div>
        <label>Study Time</label>
        <input
          type="number"
          value={study}
          min={1}
          max={60}
          onChange={e => setStudy(parseInt(e.target.value))}
        />
        <span>min</span>
      </div>

      <div>
        <label>Rest Time</label>
        <input
          type="number"
          value={rest}
          min={1}
          max={30}
          onChange={e => setRest(parseInt(e.target.value))}
        />
        <span>min</span>
      </div>
    </div>
  )
}