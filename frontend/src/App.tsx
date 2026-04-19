import { useState, useRef, useEffect, useMemo } from "react"
import "./index.css"
import { BsPerson } from "react-icons/bs"
import { IoSettingsOutline } from "react-icons/io5"
import { IoPlanetOutline } from "react-icons/io5"

type Mode = "stopwatch" | "pomodoro" | null
type Phase = "study" | "rest"
type PlanetState = "unlocked" | "silhouette" | "locked"

interface PlanetDef {
  id: number
  name: string
  img: string | null
  state: PlanetState
  orbitR: number
  speed: number
  size: number
  startOffset: number
  desc: string
  type: string
  mass: string
  temp: string
  color: string
}

const PLANET_DATA: PlanetDef[] = [
  {
    id: 0, name: "INTARIA", img: "/ast0.png", state: "unlocked",
    orbitR: 76, speed: 18, size: 40, startOffset: 0.15,
    desc: "A volcanic hellworld in perpetual eruption. Its iron-rich crust glows amber under constant magma tides. Survey probes detected rhythmic seismic pulses—almost like a heartbeat.",
    type: "VOLCANIC", mass: "1.3 M⊕", temp: "847°C", color: "rgba(255,120,30,0.9)",
  },
  {
    id: 1, name: "LUMINARA", img: "/frame0.png", state: "unlocked",
    orbitR: 118, speed: 31, size: 44, startOffset: 0.62,
    desc: "A chromatic ocean world swathed in bioluminescent algae. Its cloud cover scatters light into perpetual aurora. Probes found complex organic compounds in the upper atmosphere.",
    type: "OCEAN", mass: "0.9 M⊕", temp: "22°C", color: "rgba(74,158,255,0.9)",
  },
  {
    id: 2, name: "???", img: null, state: "silhouette",
    orbitR: 162, speed: 46, size: 36, startOffset: 0.33,
    desc: "", type: "", mass: "", temp: "", color: "rgba(255,255,255,0.2)",
  },
  {
    id: 3, name: "???", img: null, state: "silhouette",
    orbitR: 208, speed: 63, size: 38, startOffset: 0.77,
    desc: "", type: "", mass: "", temp: "", color: "rgba(255,255,255,0.2)",
  },
  { id: 4, name: "LOCKED", img: null, state: "locked", orbitR: 252, speed: 82, size: 30, startOffset: 0.48, desc: "", type: "", mass: "", temp: "", color: "rgba(255,255,255,0.08)" },
  { id: 5, name: "LOCKED", img: null, state: "locked", orbitR: 296, speed: 103, size: 28, startOffset: 0.11, desc: "", type: "", mass: "", temp: "", color: "rgba(255,255,255,0.06)" },
  { id: 6, name: "LOCKED", img: null, state: "locked", orbitR: 340, speed: 126, size: 26, startOffset: 0.55, desc: "", type: "", mass: "", temp: "", color: "rgba(255,255,255,0.05)" },
  { id: 7, name: "LOCKED", img: null, state: "locked", orbitR: 384, speed: 152, size: 24, startOffset: 0.22, desc: "", type: "", mass: "", temp: "", color: "rgba(255,255,255,0.04)" },
  { id: 8, name: "LOCKED", img: null, state: "locked", orbitR: 428, speed: 181, size: 22, startOffset: 0.84, desc: "", type: "", mass: "", temp: "", color: "rgba(255,255,255,0.03)" },
]

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

  // Solar system panel state
  const [selectedPlanet, setSelectedPlanet] = useState<number | null>(null)

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
              className="relative !block !w-auto !h-auto !aspect-auto !px-16 !py-5 !border !border-blue-400/40 !rounded-xl !bg-blue-400/10 !backdrop-blur-md !text-3xl !font-[Orbitron] !text-blue-400 !tracking-[0.4em] hover:!text-white hover:!border-blue-300 hover:!bg-blue-400/20 !font-bold !transition-all !duration-300 !shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              LOCK IN
            </button>
          </div>
        )}

        {/* Mode picker */}
        {isVisible && !mode && (
          <div className="flex flex-col items-center gap-6 mt-4">
            <p className="font-[Orbitron] text-blue-400 text-xl tracking-widest text-sm font-bold">SELECT MODE:</p>
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

      {/* ── Solar System Inventory Modal ── */}
      {showInventory && (
        <div className="panel-overlay" onClick={() => { setShowInventory(false); setSelectedPlanet(null) }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#07111f',
              border: '1px solid rgba(74,158,255,0.2)',
              borderRadius: 20,
              padding: '28px 32px 24px',
              width: 'min(92vw, 860px)',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 0 80px rgba(74,158,255,0.06), 0 0 60px rgba(255,80,0,0.05), 0 30px 80px rgba(0,0,0,0.8)',
              position: 'relative',
            }}
          >
            {/* Keyframe styles */}
            <style>{`
              @keyframes orbit-spin {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
              }
              @keyframes planet-counter {
                from { transform: translateX(-50%) translateY(-50%) rotate(0deg); }
                to   { transform: translateX(-50%) translateY(-50%) rotate(-360deg); }
              }
              @keyframes red-giant-pulse {
                0%, 100% {
                  box-shadow: 0 0 28px #ff9900, 0 0 60px rgba(255,80,0,0.65), 0 0 120px rgba(200,40,0,0.3);
                  transform: translate(-50%, -50%) scale(1);
                }
                50% {
                  box-shadow: 0 0 42px #ffbb00, 0 0 85px rgba(255,110,0,0.75), 0 0 180px rgba(220,50,0,0.45);
                  transform: translate(-50%, -50%) scale(1.07);
                }
              }
              @keyframes corona-spin {
                from { transform: translate(-50%, -50%) rotate(0deg); }
                to   { transform: translate(-50%, -50%) rotate(360deg); }
              }
              @keyframes corona-spin-rev {
                from { transform: translate(-50%, -50%) rotate(0deg); }
                to   { transform: translate(-50%, -50%) rotate(-360deg); }
              }
              @keyframes info-slide-up {
                from { opacity: 0; transform: translateY(10px); }
                to   { opacity: 1; transform: translateY(0); }
              }
              @keyframes scan-line {
                0%   { top: 0%; opacity: 0.5; }
                100% { top: 100%; opacity: 0; }
              }
              .planet-unlocked-wrap:hover img {
                filter: brightness(1.3) drop-shadow(0 0 10px rgba(74,158,255,0.9));
              }
              .planet-silhouette-wrap:hover .sil-circle {
                filter: brightness(2.5) drop-shadow(0 0 8px rgba(255,255,255,0.4));
              }
              .planet-unlocked-wrap, .planet-silhouette-wrap {
                transition: filter 0.2s;
              }
            `}</style>

            {/* Header */}
            <div className="panel-header" style={{ marginBottom: 6 }}>
              <div>
                <span className="panel-title" style={{ fontSize: '0.88rem' }}>STELLAR CARTOGRAPHY</span>
                <div style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '0.53rem',
                  letterSpacing: '0.3em',
                  color: 'rgba(255,120,30,0.75)',
                  marginTop: 4,
                }}>
                  RGC-4471 · RED GIANT PHASE · CLASS M5
                </div>
              </div>
              <button className="panel-close" onClick={() => { setShowInventory(false); setSelectedPlanet(null) }}>✕</button>
            </div>

            {/* Solar System Canvas */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: 530,
              overflow: 'hidden',
              borderRadius: 12,
              background: 'radial-gradient(ellipse at 50% 50%, rgba(255,60,0,0.04) 0%, rgba(74,158,255,0.015) 40%, transparent 70%)',
              marginTop: 12,
            }}>

              {/* Static orbit rings */}
              {PLANET_DATA.map(p => (
                <div key={`ring-${p.id}`} style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: p.orbitR * 2,
                  height: p.orbitR * 2,
                  marginLeft: -p.orbitR,
                  marginTop: -p.orbitR,
                  borderRadius: '50%',
                  border: `1px solid rgba(255,255,255,${p.state === 'unlocked' ? '0.09' : p.state === 'silhouette' ? '0.05' : '0.03'})`,
                  pointerEvents: 'none',
                }} />
              ))}

              {/* Red Giant Star */}
              {/* Outer corona layer (slow spin) */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,100,0,0.12) 0%, rgba(255,50,0,0.06) 50%, transparent 70%)',
                animation: 'corona-spin 12s linear infinite',
                pointerEvents: 'none',
                zIndex: 9,
              }} />
              {/* Inner corona */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,170,30,0.2) 0%, rgba(255,80,0,0.1) 55%, transparent 75%)',
                animation: 'corona-spin-rev 7s linear infinite',
                pointerEvents: 'none',
                zIndex: 9,
              }} />
              {/* Star body */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 36% 34%, #fff8e0, #ffcc44 20%, #ff8800 46%, #cc3300 72%, #881100)',
                animation: 'red-giant-pulse 4.5s ease-in-out infinite',
                zIndex: 10,
              }} />

              {/* Orbiting planets */}
              {PLANET_DATA.map(p => {
                const delay = `-${(p.startOffset * p.speed).toFixed(2)}s`
                return (
                  <div key={p.id} style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: p.orbitR * 2,
                    height: p.orbitR * 2,
                    marginLeft: -p.orbitR,
                    marginTop: -p.orbitR,
                    animationName: 'orbit-spin',
                    animationDuration: `${p.speed}s`,
                    animationTimingFunction: 'linear',
                    animationIterationCount: 'infinite',
                    animationDelay: delay,
                    zIndex: p.state === 'unlocked' ? 7 : p.state === 'silhouette' ? 6 : 5,
                    pointerEvents: 'none',
                  }}>
                    <div
                      className={
                        p.state === 'unlocked' ? 'planet-unlocked-wrap' :
                        p.state === 'silhouette' ? 'planet-silhouette-wrap' : ''
                      }
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        width: p.size,
                        height: p.size,
                        animationName: 'planet-counter',
                        animationDuration: `${p.speed}s`,
                        animationTimingFunction: 'linear',
                        animationIterationCount: 'infinite',
                        animationDelay: delay,
                        cursor: p.state !== 'locked' ? 'pointer' : 'default',
                        pointerEvents: 'auto',
                      }}
                      onClick={() => {
                        if (p.state !== 'locked') {
                          setSelectedPlanet(prev => prev === p.id ? null : p.id)
                        }
                      }}
                    >
                      {/* Unlocked: real planet image */}
                      {p.state === 'unlocked' && (
                        <img
                          src={p.img!}
                          alt={p.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                      )}

                      {/* Silhouette: dark sphere with subtle glow */}
                      {p.state === 'silhouette' && (
                        <div
                          className="sil-circle"
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle at 33% 33%, #1c1c30, #0c0c1a)',
                            border: '1px solid rgba(255,255,255,0.09)',
                            boxShadow: 'inset 0 0 14px rgba(0,0,0,0.9)',
                          }}
                        />
                      )}

                      {/* Locked: muted sphere with lock */}
                      {p.state === 'locked' && (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.12)"
                            width={Math.round(p.size * 0.52)}
                            height={Math.round(p.size * 0.52)}>
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                          </svg>
                        </div>
                      )}

                      {/* Selected ring highlight */}
                      {selectedPlanet === p.id && (
                        <div style={{
                          position: 'absolute',
                          inset: -5,
                          borderRadius: '50%',
                          border: `1.5px solid ${p.color}`,
                          boxShadow: `0 0 12px ${p.color}, 0 0 24px ${p.color.replace('0.9', '0.3')}`,
                          pointerEvents: 'none',
                        }} />
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Planet info panel — slides up from bottom of canvas */}
              {selectedPlanet !== null && (() => {
                const p = PLANET_DATA.find(pl => pl.id === selectedPlanet)!
                return (
                  <div style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    right: 12,
                    background: 'rgba(4,10,22,0.94)',
                    border: `1px solid ${p.color.replace('0.9', '0.35')}`,
                    borderRadius: 14,
                    padding: '16px 22px',
                    backdropFilter: 'blur(14px)',
                    zIndex: 30,
                    animation: 'info-slide-up 0.25s ease-out forwards',
                    overflow: 'hidden',
                  }}>
                    {/* Scan line effect */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: 2,
                      background: `linear-gradient(90deg, transparent, ${p.color.replace('0.9', '0.4')}, transparent)`,
                      animation: 'scan-line 2.5s linear infinite',
                      pointerEvents: 'none',
                    }} />

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                      {/* Planet image thumbnail */}
                      {p.state === 'unlocked' && (
                        <img src={p.img!} alt={p.name} style={{
                          width: 52, height: 52, borderRadius: '50%',
                          objectFit: 'contain', flexShrink: 0,
                          boxShadow: `0 0 16px ${p.color.replace('0.9', '0.5')}`,
                        }} />
                      )}
                      {p.state === 'silhouette' && (
                        <div style={{
                          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                          background: 'radial-gradient(circle at 33% 33%, #1c1c30, #0c0c1a)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }} />
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Planet name */}
                        <div style={{
                          fontFamily: "'Orbitron', monospace",
                          fontSize: '0.88rem',
                          letterSpacing: '0.3em',
                          color: p.state === 'unlocked' ? p.color : 'rgba(255,200,80,0.8)',
                          marginBottom: 10,
                          textShadow: p.state === 'unlocked' ? `0 0 12px ${p.color.replace('0.9', '0.5')}` : 'none',
                        }}>
                          {p.name}
                        </div>

                        {p.state === 'unlocked' && (
                          <>
                            {/* Stats row */}
                            <div style={{ display: 'flex', gap: 28, marginBottom: 10 }}>
                              {[
                                { label: 'TYPE', value: p.type },
                                { label: 'MASS', value: p.mass },
                                { label: 'SURFACE TEMP', value: p.temp },
                              ].map(({ label, value }) => (
                                <div key={label}>
                                  <div style={{
                                    fontFamily: "'Orbitron', monospace",
                                    fontSize: '0.48rem', letterSpacing: '0.22em',
                                    color: 'rgba(255,255,255,0.28)', marginBottom: 3,
                                  }}>{label}</div>
                                  <div style={{
                                    fontFamily: "'Orbitron', monospace",
                                    fontSize: '0.68rem', color: '#e0f0ff', letterSpacing: '0.08em',
                                  }}>{value}</div>
                                </div>
                              ))}
                            </div>
                            {/* Description */}
                            <div style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: '0.57rem',
                              color: 'rgba(255,255,255,0.5)',
                              letterSpacing: '0.04em',
                              lineHeight: 1.75,
                            }}>
                              {p.desc}
                            </div>
                          </>
                        )}

                        {p.state === 'silhouette' && (
                          <div style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: '0.57rem',
                            letterSpacing: '0.12em',
                            lineHeight: 1.8,
                            color: 'rgba(255,190,60,0.7)',
                          }}>
                            ◈ ANOMALOUS SIGNAL DETECTED<br />
                            <span style={{ color: 'rgba(255,255,255,0.32)', fontSize: '0.52rem' }}>
                              Spectral classification pending. Orbital resonance suggests significant mass.<br />
                              Continue studying to pierce the veil.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Dismiss */}
                      <button
                        onClick={() => setSelectedPlanet(null)}
                        style={{
                          background: 'transparent', border: 'none',
                          color: 'rgba(255,255,255,0.25)', cursor: 'pointer',
                          fontSize: '0.75rem', padding: 0, lineHeight: 1, flexShrink: 0,
                          fontFamily: 'monospace',
                        }}
                      >✕</button>
                    </div>
                  </div>
                )
              })()}

              {/* Idle hint */}
              {selectedPlanet === null && (
                <div style={{
                  position: 'absolute',
                  bottom: 16, left: '50%',
                  transform: 'translateX(-50%)',
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '0.52rem',
                  letterSpacing: '0.35em',
                  color: 'rgba(255,255,255,0.14)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}>
                  SELECT A BODY TO SCAN
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 16,
              paddingTop: 14,
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: '0.53rem',
                letterSpacing: '0.25em',
                color: 'rgba(255,255,255,0.18)',
              }}>
                PLANETS CATALOGUED
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Mini legend */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  {[
                    { label: 'UNLOCKED', color: '#4a9eff' },
                    { label: 'UNKNOWN', color: 'rgba(255,255,255,0.3)' },
                    { label: 'LOCKED', color: 'rgba(255,255,255,0.12)' },
                  ].map(({ label, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                      <span style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: '0.45rem',
                        letterSpacing: '0.15em',
                        color,
                      }}>{label}</span>
                    </div>
                  ))}
                </div>
                <div style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '0.68rem',
                  color: '#4a9eff',
                  letterSpacing: '0.15em',
                  marginLeft: 8,
                }}>
                  2 / 9
                </div>
              </div>
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
                <span className="profile-val">Lortisol</span>
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