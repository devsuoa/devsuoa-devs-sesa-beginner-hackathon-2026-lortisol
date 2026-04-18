import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<'timer' | 'pomodoro'>('timer')

  function handleStart() {
    if (selected === 'timer') navigate('/timer')
    else navigate('/settings')
  }

  return (
    <div className="home-container">
      <button onClick={() => navigate('/settings')}>⚙ Settings</button>

      <div className="toggle-row">
        <button
          className={selected === 'timer' ? 'toggle-active' : ''}
          onClick={() => setSelected('timer')}
        >
          Timer
        </button>
        <button
          className={selected === 'pomodoro' ? 'toggle-active' : ''}
          onClick={() => setSelected('pomodoro')}
        >
          Pomodoro
        </button>
      </div>

      <button onClick={handleStart}>Start Studying</button>
    </div>
  )
}