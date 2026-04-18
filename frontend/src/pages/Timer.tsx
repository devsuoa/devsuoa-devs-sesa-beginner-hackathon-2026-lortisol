import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Timer() {
  const navigate = useNavigate()
  const [display, setDisplay] = useState("00:00")
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const secondsRef = useRef(0)

  function startTimer() {
    if (running) return
    setRunning(true)
    intervalRef.current = setInterval(() => {
      secondsRef.current += 1
      const mins = Math.floor(secondsRef.current / 60)
      const secs = secondsRef.current % 60
      setDisplay(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`)
    }, 1000)
  }

  function pauseTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
  }

  function endSession() {
    pauseTimer()
    secondsRef.current = 0
    setDisplay("00:00")
    setRunning(false)
  }

  return (
    <div className="container">
      <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
      <div className="timer">{display}</div>
      <div className="buttons">
        <button
          onClick={running ? pauseTimer : startTimer}
          className={running ? 'btn-stop' : 'btn-start'}
        >
          {running ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <rect x="5" y="3" width="4" height="18" />
              <rect x="15" y="3" width="4" height="18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <button onClick={endSession} className="btn-end">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <rect x="4" y="4" width="16" height="16" />
          </svg>
        </button>
      </div>
    </div>
  )
}