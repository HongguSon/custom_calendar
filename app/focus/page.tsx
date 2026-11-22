'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type Mode = 'focus' | 'break'

const FOCUS_PRESETS = [15, 25, 30, 45, 50, 60]
const BREAK_PRESETS = [3, 5, 10, 15, 20]

// 브라우저 내장 오디오 차임벨 재생 (외부 파일 없이 순수 Web Audio API)
function playChimeSound(isFocusComplete: boolean) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const notes = isFocusComplete ? [523.25, 659.25, 783.99, 1046.5] : [783.99, 659.25, 523.25]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15)

      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime + i * 0.15)
      osc.stop(ctx.currentTime + i * 0.15 + 0.4)
    })
  } catch (e) {
    console.error('Audio play error:', e)
  }
}

export default function FocusPage() {
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [mode, setMode] = useState<Mode>('focus')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 로컬스토리지에서 이전 설정 및 세션 불러오기
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('focus_timer_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        if (parsed.focus && parsed.break) {
          setFocusMinutes(parsed.focus)
          setBreakMinutes(parsed.break)
          setTimeLeft(parsed.focus * 60)
        }
      }

      const today = new Date().toLocaleDateString('ko-KR')
      const savedSessions = localStorage.getItem(`focus_sessions_${today}`)
      if (savedSessions) {
        setSessions(parseInt(savedSessions, 10) || 0)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // 타이머 실행 루프
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)

            if (mode === 'focus') {
              playChimeSound(true)
              const newSessions = sessions + 1
              setSessions(newSessions)
              try {
                const today = new Date().toLocaleDateString('ko-KR')
                localStorage.setItem(`focus_sessions_${today}`, String(newSessions))
              } catch (e) {}

              alert('🎉 집중 시간 완료! 수고했어요. 달콤한 휴식을 시작해봐요 ☕')
              setMode('break')
              setTimeLeft(breakMinutes * 60)
            } else {
              playChimeSound(false)
              alert('☕ 휴식 시간 끝! 다시 집중해볼까요? 🔥')
              setMode('focus')
              setTimeLeft(focusMinutes * 60)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current!)
  }, [running, mode, focusMinutes, breakMinutes, sessions])

  // 시간 설정 변경 시 저장 및 타이머 초기화
  const handleUpdateDuration = (newFocus: number, newBreak: number) => {
    setFocusMinutes(newFocus)
    setBreakMinutes(newBreak)
    try {
      localStorage.setItem(
        'focus_timer_settings',
        JSON.stringify({ focus: newFocus, break: newBreak })
      )
    } catch (e) {}

    // 정지 상태일 때 현재 모드 시간 즉시 반영
    if (!running) {
      setTimeLeft((mode === 'focus' ? newFocus : newBreak) * 60)
    }
  }

  const reset = () => {
    clearInterval(intervalRef.current!)
    setRunning(false)
    setTimeLeft((mode === 'focus' ? focusMinutes : breakMinutes) * 60)
  }

  const switchMode = (m: Mode) => {
    clearInterval(intervalRef.current!)
    setRunning(false)
    setMode(m)
    setTimeLeft((m === 'focus' ? focusMinutes : breakMinutes) * 60)
  }

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')
  const total = (mode === 'focus' ? focusMinutes : breakMinutes) * 60
  const progress = total > 0 ? ((total - timeLeft) / total) * 100 : 0
  const circumference = 2 * Math.PI * 90

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 text-gray-900">
      <div className="max-w-lg mx-auto w-full">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-700 transition text-2xl p-1">←</Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">⏱️ 집중 모드</h1>
              <p className="text-xs sm:text-sm text-gray-500">
                {focusMinutes}분 집중, {breakMinutes}분 휴식
              </p>
            </div>
          </div>

          {/* 시간 설정 버튼 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            type="button"
            className={`p-2.5 rounded-xl border text-sm font-medium transition flex items-center gap-1.5 shadow-2xs ${
              showSettings
                ? 'bg-purple-100 text-purple-700 border-purple-300'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
            title="타이머 시간 설정"
          >
            <span>⚙️</span>
            <span className="text-xs font-semibold">시간 설정</span>
          </button>
        </div>

        {/* 동적 시간 설정 패널 (접었다 폈다 가능) */}
        {showSettings && (
          <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-200 mb-6 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
            <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
              <span>⚙️</span>
              <span>타이머 시간 동적 설정</span>
            </h2>

            {/* 집중 시간 설정 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-indigo-600">🧠 집중 시간</span>
                <span className="text-xs font-bold text-indigo-900">{focusMinutes}분</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {FOCUS_PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleUpdateDuration(m, breakMinutes)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      focusMinutes === m
                        ? 'bg-indigo-500 text-white shadow-xs font-bold'
                        : 'bg-gray-50 text-gray-600 hover:bg-indigo-50 border border-gray-200'
                    }`}
                  >
                    {m}분
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">직접 입력:</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={focusMinutes}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (val > 0 && val <= 300) handleUpdateDuration(val, breakMinutes)
                  }}
                  className="w-16 px-2 py-1 text-center text-xs font-bold rounded-lg border border-gray-200 text-gray-900 bg-white outline-none focus:border-indigo-400"
                />
                <span className="text-xs text-gray-500">분</span>
              </div>
            </div>

            {/* 휴식 시간 설정 */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-green-600">☕ 휴식 시간</span>
                <span className="text-xs font-bold text-green-900">{breakMinutes}분</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {BREAK_PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleUpdateDuration(focusMinutes, m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      breakMinutes === m
                        ? 'bg-green-500 text-white shadow-xs font-bold'
                        : 'bg-gray-50 text-gray-600 hover:bg-green-50 border border-gray-200'
                    }`}
                  >
                    {m}분
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">직접 입력:</span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={breakMinutes}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (val > 0 && val <= 120) handleUpdateDuration(focusMinutes, val)
                  }}
                  className="w-16 px-2 py-1 text-center text-xs font-bold rounded-lg border border-gray-200 text-gray-900 bg-white outline-none focus:border-green-400"
                />
                <span className="text-xs text-gray-500">분</span>
              </div>
            </div>

            {running && (
              <p className="text-[11px] text-amber-600 bg-amber-50 rounded-lg p-2 mt-3 font-medium">
                ⚠️ 현재 타이머 진행 중입니다. 변경된 시간은 초기화하거나 다음 세션부터 자동 적용됩니다.
              </p>
            )}
          </div>
        )}

        {/* 모드 탭 */}
        <div className="flex gap-2 justify-center mb-6 sm:mb-8">
          {(['focus', 'break'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              type="button"
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition active:scale-95 shadow-2xs ${
                mode === m
                  ? m === 'focus'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-green-500 text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {m === 'focus' ? `🧠 집중 (${focusMinutes}분)` : `☕ 휴식 (${breakMinutes}분)`}
            </button>
          ))}
        </div>

        {/* 원형 타이머 */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <svg width="220" height="220" className="-rotate-90">
              <circle cx="110" cy="110" r="90" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle
                cx="110" cy="110" r="90" fill="none"
                stroke={mode === 'focus' ? '#6366f1' : '#22c55e'}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold text-gray-900 tabular-nums tracking-tight">
                {mm}:{ss}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-gray-400 mt-1.5">
                {mode === 'focus' ? '집중 모드 🔥' : '휴식 모드 ☕'}
              </span>
            </div>
          </div>
        </div>

        {/* 타이머 제어 버튼 */}
        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={reset}
            type="button"
            className="px-6 py-3 bg-white text-gray-600 rounded-full font-semibold border border-gray-200 hover:bg-gray-50 active:scale-95 transition shadow-2xs text-sm"
          >
            초기화
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            type="button"
            className={`px-10 py-3 rounded-full font-bold text-white shadow-sm transition active:scale-95 text-sm sm:text-base ${
              running
                ? 'bg-gray-500 hover:bg-gray-600'
                : mode === 'focus'
                ? 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200'
                : 'bg-green-500 hover:bg-green-600 shadow-green-200'
            }`}
          >
            {running ? '⏸ 일시정지' : '▶ 시작'}
          </button>
        </div>

        {/* 오늘 완료한 세션 카운트 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 text-center">
          <p className="text-xs sm:text-sm font-medium text-gray-400 mb-2">오늘 완료한 뽀모도로 세션</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {Array.from({ length: Math.max(sessions, 4) }).map((_, i) => (
              <span
                key={i}
                className={`text-2xl transition-all duration-300 ${
                  i < sessions ? 'opacity-100 scale-110' : 'opacity-20'
                }`}
              >
                🍅
              </span>
            ))}
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-2">{sessions}개 완료</p>
        </div>

      </div>
    </main>
  )
}
