import { useState, useRef, useEffect, useMemo } from "react"
import "./index.css"
import { BsPerson } from "react-icons/bs";
import { IoSettingsOutline } from "react-icons/io5"
import { IoPlanetOutline } from "react-icons/io5";

export default function App() {
  const [minutes, setMinutes] = useState(25)
  const [display, setDisplay] = useState("25:00")
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const sourceRef = useRef<EventSource | null>(null)
  const remainingRef = useRef(25 * 60)

  const planetImages = useMemo(() => [
    "/frame0.png",
    "/frame1.png",
    "/frame2.png",
    "/frame3.png",
    "/frame4.png",
    "/frame5.png",
    "/frame6.png",
    "/frame7.png",
    "/frame8.png",
  ], [])

  const [planetIndex, setPlanetIndex] = useState(0)
  const [spinSpeed, setSpinSpeed] = useState(500) // 0.5s default
  const clickTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPlanetIndex((prev) => (prev + 1) % planetImages.length)
    }, spinSpeed)

    return () => window.clearInterval(interval)
  }, [spinSpeed, planetImages.length])

  function handlePlanetClick() {
    setSpinSpeed(100) // speed up

    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current)
    }

    clickTimeoutRef.current = window.setTimeout(() => {
      setSpinSpeed(500) // back to normal
    }, 1200)
  }

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current)
      }
    }
  }, [])

  function startTimer() {
    if (running) return
    setRunning(true)
    setFinished(false)

    const source = new EventSource(`http://127.0.0.1:8000/timer/${remainingRef.current}`)
    sourceRef.current = source

    source.onmessage = (e) => {
      if (e.data === "DONE") {
        setDisplay("00:00")
        setFinished(true)
        setRunning(false)
        remainingRef.current = 0
        source.close()
      } else {
        const [mins, secs] = e.data.split(":").map(Number)
        const total = mins * 60 + secs
        remainingRef.current = total
        setRemaining(total)
        setDisplay(e.data)
      }
    }
  }

  function pauseTimer() {
    if (sourceRef.current) {
      sourceRef.current.close()
      sourceRef.current = null
    }
    setRunning(false)
  }

  function endSession() {
    pauseTimer()
    const total = minutes * 60
    remainingRef.current = total
    setRemaining(total)
    setDisplay(`${String(minutes).padStart(2, "0")}:00`)
    setFinished(false)
  }

  return (  
    <>  
{/* Top navbar */}
<div className="fixed top-0 left-0 right-0 flex items-center justify-end px-6 py-4">
 
  <span className="absolute left-1/2 -translate-x-1/2 translate-y-35 font-[Orbitron] text-6xl text-white font-bold tracking-widest">
    Spaced In
  </span>

  <div className="flex gap-3">

  <button className="btn-icon" title="Solar System">
    <IoPlanetOutline size={47}/>
  </button>

  <button className="btn-icon" title="Profile">
    <BsPerson size={47}/>
  </button>

  <button className="btn-icon" title="Settings">
    <IoSettingsOutline size={47}/>
  </button>

  </div>
</div>

<div className="container">
      <div className="planet-wrapper" onClick={handlePlanetClick}>
        <img
          src={planetImages[planetIndex]}
          width="400"
          height="400"
          alt="Spinning planet"
          className="planet-image"
          draggable={false}
        />
      </div>
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
            if (!running) {
              const total = val * 60
              remainingRef.current = total
              setRemaining(total)
              setDisplay(`${String(val).padStart(2, "0")}:00`)
            }
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
        
        <button onClick={pauseTimer} disabled={!running} className="btn-stop" title="Pause">
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
  </>
  )
}