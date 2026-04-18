import { useState, useRef } from "react"
import "./index.css"

export default function App() {
  const [minutes, setMinutes] = useState(25)
  const [display, setDisplay] = useState("25:00")
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const sourceRef = useRef<EventSource | null>(null)

  function startTimer() {
    if (running) return
    const seconds = minutes * 60
    setRunning(true)
    setFinished(false)

    const source = new EventSource(`http://127.0.0.1:8000/timer/${seconds}`)
    sourceRef.current = source

    source.onmessage = (e) => {
      if (e.data === "DONE") {
        setDisplay("00:00")
        setFinished(true)
        setRunning(false)
        source.close()
      } else {
        setDisplay(e.data)
      }
    }
  }

  function stopTimer() {
    if (sourceRef.current) {
      sourceRef.current.close()
      sourceRef.current = null
    }
    setRunning(false)
  }

  function endSession() {
    stopTimer()
    setDisplay(`${String(minutes).padStart(2, "0")}:00`)
    setFinished(false)
  }

  return (
    <div className="container">
      <div className="timer">{display}</div>

      <div className="minutes-row">
        <label>Minutes</label>
        <input
          type="number"
          value={minutes}
          min={1}
          max={120}
          onChange={(e) => {
            const val = parseInt(e.target.value)
            setMinutes(val)
            if (!running) setDisplay(`${String(val).padStart(2, "0")}:00`)
          }}
          disabled={running}
        />
      </div>

      {finished && <p className="message">Mission complete.</p>}

      <div className="buttons">
        <button onClick={startTimer} disabled={running} className="btn-start" title="Start">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        </button>
        <button onClick={stopTimer} disabled={!running} className="btn-stop" title="Pause">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <rect x="5" y="3" width="4" height="18" />
            <rect x="15" y="3" width="4" height="18" />
          </svg>
        </button>
        <button onClick={endSession} className="btn-end" title="End Session">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <rect x="4" y="4" width="16" height="16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
