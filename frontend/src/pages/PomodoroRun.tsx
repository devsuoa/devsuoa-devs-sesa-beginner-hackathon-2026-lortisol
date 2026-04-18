import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

type Phase = 'study' | 'rest'

export default function PomodoroRun() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { study: number; rest: number } | null
  const study = state?.study ?? 25
  const rest = state?.rest ?? 5

  const [phase, setPhase] = useState<Phase>('study')
  const [remaining, setRemaining] = useState(study * 60)
  const [running, setRunning] = useState(false)
  const [round, setRound] = useState(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const remainingRef = useRef(study * 60)

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  function startTimer() {
    if (running) return
    setRunning(true)
    intervalRef.current = setInterval(() => {
      remainingRef.current -= 1
      setRemaining(remainingRef.current)
      if (remainingRef.current <= 0) {
        clearInterval(intervalRef.current!)
        setRunning(false)
        nextPhase()
      }
    }, 1000)
  }

  function pauseTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
  }

  function nextPhase() {
    if (phase === 'study') {
      setPhase('rest')
      remainingRef.current = rest * 60
      setRemaining(remainingRef.current)
    } else {
      setPhase('study')
      setRound(r => r + 1)
      remainingRef.current = study * 60
      setRemaining(remainingRef.current)
    }
  }

  function endSession() {
    pauseTimer()
    navigate('/')
  }

  return (
    <div>
      <button onClick={endSession}>← End Session</button>
      <p>Round {round} — {phase === 'study' ? 'Study' : 'Rest'}</p>
      <div className="timer">{formatTime(remaining)}</div>
      <div className="buttons">
        <button onClick={startTimer} disabled={running} className="btn-start">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        </button>
        <button onClick={pauseTimer} disabled={!running} className="btn-stop">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <rect x="5" y="3" width="4" height="18" />
            <rect x="15" y="3" width="4" height="18" />
          </svg>
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