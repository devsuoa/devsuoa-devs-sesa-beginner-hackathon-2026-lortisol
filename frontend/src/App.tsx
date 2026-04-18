import { useState, useRef, useEffect, useMemo } from "react"
import "./index.css"
import { BsPerson } from "react-icons/bs"
import { IoSettingsOutline } from "react-icons/io5"
import { IoPlanetOutline } from "react-icons/io5"

type Mode = "stopwatch" | "pomodoro" | null
type Phase = "study" | "rest"

export default function App() {
  const [isVisible, setIsVisible] = useState(false)
  const [mode, setMode] = useState<Mode>(null)

  // Pomodoro config
  const [pomConfigured, setPomConfigured] = useState(false)
  const [studyMinutes, setStudyMinutes] = useState(25)
  const [restMinutes, setRestMinutes] = useState(5)

  // Pomodoro runtime
  const [phase, setPhase] = useState<Phase>("study")
  const [display, setDisplay] = useState("25:00")
  const [, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)
  const sourceRef = useRef<EventSource | null>(null)
  const remainingRef = useRef(25 * 60)
  const phaseRef = useRef<Phase>("study")
  const studyRef = useRef(25)
  const restRef = useRef(5)

  // Stopwatch state
  const [swDisplay, setSwDisplay] = useState("00:00:00")
  const [swRunning, setSwRunning] = useState(false)
  const swRef = useRef(0)
  const swIntervalRef = useRef<number | null>(null)

  // Planet animation
  const planets = useMemo(() => [
    [
      "/ast0.png", "/ast1.png", "/ast2.png",
      "/ast3.png", "/ast4.png", "/ast5.png",
      "/ast6.png", "/ast7.png", "/ast8.png",
      "/ast9.png", "/ast10.png", "/ast11.png",
      "/ast12.png", "/ast13.png", "/ast14.png",
    ],
    [
      "/frame0.png", "/frame1.png", "/frame2.png",
      "/frame3.png", "/frame4.png", "/frame5.png",
      "/frame6.png", "/frame7.png", "/frame8.png",
    ],
  ], [])
  const [currentPlanet, setCurrentPlanet] = useState(0)
  const planetImages = planets[currentPlanet]
  const [planetIndex, setPlanetIndex] = useState(0)
  const [spinSpeed, setSpinSpeed] = useState(500)
  const [planetFlash, setPlanetFlash] = useState(false)
  const clickTimeoutRef = useRef<number | null>(null)

  // Panel states
  const [showInventory, setShowInventory] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // User stats
  const [totalSeconds, setTotalSeconds] = useState(0)

  // Settings
  const [autoStartPhases, setAutoStartPhases] = useState(true)
  const [soundNotifs, setSoundNotifs] = useState(false)
  const [longBreakInterval, setLongBreakInterval] = useState(4)
  const [longBreakMins, setLongBreakMins] = useState(15)
  const [showCycles, setShowCycles] = useState(true)
  const autoStartRef = useRef(true)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPlanetIndex((prev) => (prev + 1) % planetImages.length)
    }, spinSpeed)
    return () => window.clearInterval(interval)
  }, [spinSpeed, planetImages.length])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "p" || e.key === "P") {
        setCurrentPlanet((prev) => (prev + 1) % planets.length)
        setPlanetIndex(0)
        setPlanetFlash(true)
        setTimeout(() => setPlanetFlash(false), 600)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [planets.length])

  function handlePlanetClick() {
    setSpinSpeed(100)
    if (clickTimeoutRef.current) window.clearTimeout(clickTimeoutRef.current)
    clickTimeoutRef.current = window.setTimeout(() => setSpinSpeed(500), 1200)
  }

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) window.clearTimeout(clickTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    fetch("http://127.0.0.1:8000/stats")
      .then(r => r.json())
      .then(d => setTotalSeconds(d.total_seconds ?? 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!showSettings) return
    function handleOutside() { setShowSettings(false) }
    window.addEventListener("click", handleOutside)
    return () => window.removeEventListener("click", handleOutside)
  }, [showSettings])

  // ── Pomodoro ──────────────────────────────────────────────

  function startPhase(seconds: number) {
    if (sourceRef.current) {
      sourceRef.current.close()
      sourceRef.current = null
    }
    setRunning(true)
    remainingRef.current = seconds

    const source = new EventSource(`http://127.0.0.1:8000/timer/${seconds}`)
    sourceRef.current = source

    source.onmessage = (e) => {
      if (e.data === "DONE") {
        source.close()
        sourceRef.current = null
        setRunning(false)

        if (phaseRef.current === "study") {
          const studied = studyRef.current * 60
          fetch("http://127.0.0.1:8000/stats/add-time", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seconds: studied }),
          })
            .then(r => r.json())
            .then(d => setTotalSeconds(d.total_seconds ?? 0))
            .catch(() => {})
        }

        const nextPhase: Phase = phaseRef.current === "study" ? "rest" : "study"
        phaseRef.current = nextPhase
        setPhase(nextPhase)

        if (!autoStartRef.current) return

        if (nextPhase === "rest") {
          setCycleCount((c) => c + 1)
          const restSecs = restRef.current * 60
          remainingRef.current = restSecs
          setRemaining(restSecs)
          setDisplay(`${String(restRef.current).padStart(2, "0")}:00`)
          startPhase(restSecs)
        } else {
          const studySecs = studyRef.current * 60
          remainingRef.current = studySecs
          setRemaining(studySecs)
          setDisplay(`${String(studyRef.current).padStart(2, "0")}:00`)
          startPhase(studySecs)
        }
      } else {
        const [mins, secs] = e.data.split(":").map(Number)
        const total = mins * 60 + secs
        remainingRef.current = total
        setRemaining(total)
        setDisplay(e.data)
      }
    }
  }

  function handleStartTimer() {
    if (running) return
    startPhase(remainingRef.current)
  }

  function pauseTimer() {
    sourceRef.current?.close()
    sourceRef.current = null
    setRunning(false)
  }

  function handleBeginPomodoro() {
    studyRef.current = studyMinutes
    restRef.current = restMinutes
    phaseRef.current = "study"
    setPhase("study")
    setCycleCount(0)
    const total = studyMinutes * 60
    remainingRef.current = total
    setRemaining(total)
    setDisplay(`${String(studyMinutes).padStart(2, "0")}:00`)
    setPomConfigured(true)
  }

  // ── Stopwatch ─────────────────────────────────────────────

  function formatTotalTime(secs: number) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    if (h === 0) return `${m}m`
    return `${h}h ${m}m`
  }

  function formatStopwatch(totalSeconds: number) {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  function startStopwatch() {
    if (swRunning) return
    setSwRunning(true)
    swIntervalRef.current = window.setInterval(() => {
      swRef.current += 1
      setSwDisplay(formatStopwatch(swRef.current))
    }, 1000)
  }

  function pauseStopwatch() {
    if (swIntervalRef.current) {
      window.clearInterval(swIntervalRef.current)
      swIntervalRef.current = null
    }
    setSwRunning(false)
  }

  function resetStopwatch() {
    pauseStopwatch()
    swRef.current = 0
    setSwDisplay("00:00:00")
  }

  // ── Shared reset ──────────────────────────────────────────

  function endSession() {
    if (mode === "stopwatch" && swRef.current > 0) {
      fetch("http://127.0.0.1:8000/stats/add-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds: swRef.current }),
      })
        .then(r => r.json())
        .then(d => setTotalSeconds(d.total_seconds ?? 0))
        .catch(() => {})
    }
    pauseTimer()
    resetStopwatch()
    setDisplay(`${String(studyMinutes).padStart(2, "0")}:00`)
    setRunning(false)
    setPomConfigured(false)
    setPhase("study")
    phaseRef.current = "study"
    setCycleCount(0)
    setMode(null)
    setIsVisible(false)
  }

  return (
    <>
      {/* Top navbar */}
      <div className="fixed top-0 left-0 right-0 flex items-center justify-end px-6 py-4 z-10">
        <div className="flex gap-3">
          <button className="btn-icon" title="Planet Inventory"
            onClick={() => { setShowInventory(v => !v); setShowProfile(false); setShowSettings(false) }}>
            <IoPlanetOutline size={40} />
          </button>
          <button className="btn-icon" title="Profile"
            onClick={() => { setShowProfile(v => !v); setShowInventory(false); setShowSettings(false) }}>
            <BsPerson size={40} />
          </button>
          <button className="btn-icon" title="Settings"
            onClick={(e) => { e.stopPropagation(); setShowSettings(v => !v); setShowInventory(false); setShowProfile(false) }}>
            <IoSettingsOutline size={40} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center w-full min-h-screen pt-24 pb-20 gap-6">

        <h1 className="font-[Orbitron] text-5xl text-white font-bold tracking-widest text-center">
          Spaced In
        </h1>

        <div className={`planet-wrapper${planetFlash ? " planet-switch-flash" : ""}`} onClick={handlePlanetClick}>
          <img
            src={planetImages[planetIndex]}
            width="400" height="400"
            alt="Spinning planet"
            className="planet-image"
            draggable={false}
          />
        </div>

        {/* LOCK IN */}
        {!isVisible && (
          <div className="relative group mt-4">
            <div className="absolute -inset-0.5 bg-blue-500 rounded-lg blur opacity-20 group-hover:opacity-50 transition duration-1000"></div>
            <button
              onClick={() => setIsVisible(true)}
              className="relative !block !w-auto !h-auto !aspect-auto !px-16 !py-5 !border !border-blue-400/50 !rounded-xl !bg-slate-950 !text-3xl !font-[Orbitron] !text-blue-400 !tracking-[0.4em] hover:!text-white hover:!border-blue-300 !font-bold !transition-all !duration-300 !shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              LOCK IN
            </button>
          </div>
        )}

        {/* Mode picker */}
        {isVisible && !mode && (
          <div className="flex flex-col items-center gap-6 mt-4">
            <p className="font-[Orbitron] text-blue-400 tracking-widest text-sm">SELECT MODE</p>
            <div className="flex gap-6">
              <button onClick={() => setMode("stopwatch")} className="mode-btn">STOPWATCH</button>
              <button onClick={() => setMode("pomodoro")} className="mode-btn">POMODORO</button>
            </div>
          </div>
        )}

        {/* Pomodoro config screen */}
        {isVisible && mode === "pomodoro" && !pomConfigured && (
          <div className="flex flex-col items-center gap-6 mt-4 w-full">
            <p className="font-[Orbitron] text-blue-400 tracking-widest text-sm">CONFIGURE SESSION</p>

            <div className="pom-config-grid">
              <div className="pom-config-card">
                <span className="pom-config-label">STUDY</span>
                <div className="pom-config-controls">
                  <button
                    className="pom-adj-btn"
                    onClick={() => setStudyMinutes((m) => Math.max(1, m - 1))}
                  >−</button>
                  <input
                    type="number"
                    className="pom-config-value-input"
                    value={studyMinutes}
                    min={1}
                    max={120}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(120, parseInt(e.target.value) || 1))
                      setStudyMinutes(val)
                    }}
                  />
                  <button
                    className="pom-adj-btn"
                    onClick={() => setStudyMinutes((m) => Math.min(120, m + 1))}
                  >+</button>
                </div>
                <span className="pom-config-unit">min</span>
              </div>

              <div className="pom-config-divider">／</div>

              <div className="pom-config-card">
                <span className="pom-config-label">REST</span>
                <div className="pom-config-controls">
                  <button
                    className="pom-adj-btn"
                    onClick={() => setRestMinutes((m) => Math.max(1, m - 1))}
                  >−</button>
                  <input
                    type="number"
                    className="pom-config-value-input"
                    value={restMinutes}
                    min={1}
                    max={60}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(60, parseInt(e.target.value) || 1))
                      setRestMinutes(val)
                    }}
                  />
                  <button
                    className="pom-adj-btn"
                    onClick={() => setRestMinutes((m) => Math.min(60, m + 1))}
                  >+</button>
                </div>
                <span className="pom-config-unit">min</span>
              </div>
            </div>

            <div className="relative group mt-2">
              <div className="absolute -inset-0.5 bg-blue-500 rounded-lg blur opacity-20 group-hover:opacity-50 transition duration-700"></div>
              <button
                onClick={handleBeginPomodoro}
                className="relative !block !w-auto !h-auto !aspect-auto !px-14 !py-4 !border !border-blue-400/50 !rounded-xl !bg-slate-950 !text-xl !font-[Orbitron] !text-blue-400 !tracking-[0.4em] hover:!text-white hover:!border-blue-300 !font-bold !transition-all !duration-300 !shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                BEGIN
              </button>
            </div>

            <button onClick={endSession} className="font-[Orbitron] text-xs text-slate-500 tracking-widest hover:text-slate-300 transition mt-1 !w-auto !h-auto !border-none !bg-transparent !rounded-none !shadow-none">
              ← BACK
            </button>
          </div>
        )}

        {/* Pomodoro timer */}
        {isVisible && mode === "pomodoro" && pomConfigured && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className={`phase-badge ${phase === "study" ? "phase-study" : "phase-rest"}`}>
              {phase === "study" ? "▸ STUDY" : "◉ REST"}
            </div>

            {showCycles && (
              <div className="cycles-label">
                CYCLE {cycleCount + 1}
              </div>
            )}

            <div className="timer">{display}</div>

            <div className="pom-phase-bar">
              <div className={`pom-phase-segment ${phase === "study" ? "active-study" : ""}`}>
                STUDY {studyMinutes}m
              </div>
              <div className={`pom-phase-segment ${phase === "rest" ? "active-rest" : ""}`}>
                REST {restMinutes}m
              </div>
            </div>

            <div className="buttons">
              <button onClick={handleStartTimer} disabled={running} className="btn-start" title="Start">
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
              <button onClick={endSession} className="btn-end" title="Exit">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <rect x="4" y="4" width="16" height="16" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Stopwatch */}
        {isVisible && mode === "stopwatch" && (
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="timer">{swDisplay}</div>
            <div className="buttons">
              <button onClick={startStopwatch} disabled={swRunning} className="btn-start" title="Start">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </button>
              <button onClick={pauseStopwatch} disabled={!swRunning} className="btn-stop" title="Pause">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <rect x="5" y="3" width="4" height="18" />
                  <rect x="15" y="3" width="4" height="18" />
                </svg>
              </button>
              <button onClick={resetStopwatch} className="btn-reset" title="Reset">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                </svg>
              </button>
              <button onClick={endSession} className="btn-end" title="Exit">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <rect x="4" y="4" width="16" height="16" />
                </svg>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Inventory Modal ── */}
      {showInventory && (
        <div className="panel-overlay" onClick={() => setShowInventory(false)}>
          <div className="panel-modal" onClick={e => e.stopPropagation()}>
            <div className="panel-header">
              <span className="panel-title">INVENTORY</span>
              <button className="panel-close" onClick={() => setShowInventory(false)}>✕</button>
            </div>
            <p className="panel-subtitle">PLANETS COLLECTED</p>
            <div className="inventory-grid">
              <div className="inv-slot unlocked">
                <img src="/ast0.png" className="inv-planet-img" alt="Planet 1" />
                <span className="inv-label">INTARIA</span>
              </div>
              <div className="inv-slot unlocked">
                <img src="/frame0.png" className="inv-planet-img" alt="Asteroid" />
                <span className="inv-label">LUMINARA</span>
              </div>
              <div className="inv-slot silhouette">
                <div className="inv-silhouette-circle" />
                <span className="inv-label inv-locked-label">???</span>
              </div>
              <div className="inv-slot silhouette">
                <div className="inv-silhouette-circle" />
                <span className="inv-label inv-locked-label">???</span>
              </div>
              {[5,6,7,8,9].map(n => (
                <div key={n} className="inv-slot locked">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36" className="inv-lock-icon">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                  <span className="inv-label inv-locked-label">LOCKED</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Profile Modal ── */}
      {showProfile && (
        <div className="panel-overlay" onClick={() => setShowProfile(false)}>
          <div className="panel-modal" onClick={e => e.stopPropagation()}>
            <div className="panel-header">
              <span className="panel-title">PILOT</span>
              <button className="panel-close" onClick={() => setShowProfile(false)}>✕</button>
            </div>
            <div className="profile-grid">
              <div className="profile-row">
                <span className="profile-key">NAME</span>
                <span className="profile-val">Jacky</span>
              </div>
              <div className="profile-row">
                <span className="profile-key">TIME STUDIED</span>
                <span className="profile-val">{formatTotalTime(totalSeconds)}</span>
              </div>
              <div className="profile-row">
                <span className="profile-key">PLANETS UNLOCKED</span>
                <span className="profile-val">2 / 9</span>
              </div>
              <div className="profile-row">
                <span className="profile-key">ACHIEVEMENTS</span>
                <span className="profile-val profile-empty">— none yet —</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Dropdown ── */}
      {showSettings && (
        <div className="settings-dropdown" onClick={e => e.stopPropagation()}>
          <div className="panel-header">
            <span className="panel-title">SETTINGS</span>
            <button className="panel-close" onClick={() => setShowSettings(false)}>✕</button>
          </div>

          <div className="settings-section">TIMER</div>

          <div className="settings-row">
            <span className="settings-label">Auto-start phases</span>
            <button
              className={`toggle-btn ${autoStartPhases ? "toggle-on" : "toggle-off"}`}
              onClick={() => setAutoStartPhases(v => { autoStartRef.current = !v; return !v })}
            >{autoStartPhases ? "ON" : "OFF"}</button>
          </div>

          <div className="settings-row">
            <span className="settings-label">Long break every</span>
            <div className="settings-num-row">
              <button className="pom-adj-btn" onClick={() => setLongBreakInterval(v => Math.max(1, v - 1))}>−</button>
              <span className="settings-num">{longBreakInterval}</span>
              <button className="pom-adj-btn" onClick={() => setLongBreakInterval(v => Math.min(10, v + 1))}>+</button>
              <span className="settings-unit">cycles</span>
            </div>
          </div>

          <div className="settings-row">
            <span className="settings-label">Long break duration</span>
            <div className="settings-num-row">
              <button className="pom-adj-btn" onClick={() => setLongBreakMins(v => Math.max(1, v - 1))}>−</button>
              <span className="settings-num">{longBreakMins}</span>
              <button className="pom-adj-btn" onClick={() => setLongBreakMins(v => Math.min(60, v + 1))}>+</button>
              <span className="settings-unit">min</span>
            </div>
          </div>

          <div className="settings-section">DISPLAY</div>

          <div className="settings-row">
            <span className="settings-label">Show cycle counter</span>
            <button
              className={`toggle-btn ${showCycles ? "toggle-on" : "toggle-off"}`}
              onClick={() => setShowCycles(v => !v)}
            >{showCycles ? "ON" : "OFF"}</button>
          </div>

          <div className="settings-section">NOTIFICATIONS</div>

          <div className="settings-row">
            <span className="settings-label">Sound alerts</span>
            <button
              className={`toggle-btn ${soundNotifs ? "toggle-on" : "toggle-off"}`}
              onClick={() => setSoundNotifs(v => !v)}
            >{soundNotifs ? "ON" : "OFF"}</button>
          </div>
        </div>
      )}

    </>
  )
}
