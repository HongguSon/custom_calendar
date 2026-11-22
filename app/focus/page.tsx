'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type Mode = 'focus' | 'break'

const FOCUS_TIME = 25 * 60
const BREAK_TIME = 5 * 60

export default function FocusPage() {
  const [mode, setMode] = useState<Mode>('focus')
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            if (mode === 'focus') {
              setSessions((s) => s + 1)
              setMode('break')
              setTimeLeft(BREAK_TIME)
            } else {
              setMode('focus')
              setTimeLeft(FOCUS_TIME)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current!)
  }, [running, mode])

  const reset = () => {
    clearInterval(intervalRef.current!)
    setRunning(false)
    setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME)
  }

  const switchMode = (m: Mode) => {
    clearInterval(intervalRef.current!)
    setRunning(false)
    setMode(m)
    setTimeLeft(m === 'focus' ? FOCUS_TIME : BREAK_TIME)
  }

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')
  const total = mode === 'focus' ? FOCUS_TIME : BREAK_TIME
  const progress = ((total - timeLeft) / total) * 100
  const circumference = 2 * Math.PI * 90

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-lg mx-auto">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition text-2xl">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">⏱️ 집중 모드</h1>
            <p className="text-sm text-gray-400">25분 집중, 5분 휴식</p>
          </div>
        </div>

        {/* 모드 탭 */}
        <div className="flex gap-2 justify-center mb-8">
          {(['focus', 'break'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                mode === m
                  ? m === 'focus'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-green-400 text-white'
                  : 'bg-white text-gray-400 border border-gray-200'
              }`}
            >
              {m === 'focus' ? '🧠 집중' : '☕ 휴식'}
            </button>
          ))}
        </div>

        {/* 원형 타이머 */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <svg width="220" height="220" className="-rotate-90">
              <circle cx="110" cy="110" r="90" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="110" cy="110" r="90" fill="none"
                stroke={mode === 'focus' ? '#818cf8' : '#4ade80'}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-gray-800 tabular-nums">
                {mm}:{ss}
              </span>
              <span className="text-sm text-gray-400 mt-1">
                {mode === 'focus' ? '집중 중 🔥' : '휴식 중 ☕'}
              </span>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={reset}
            className="px-6 py-3 bg-white text-gray-500 rounded-full font-semibold border border-gray-200 hover:bg-gray-50 transition shadow-sm"
          >
            초기화
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            className={`px-10 py-3 rounded-full font-semibold text-white shadow-sm transition ${
              running
                ? 'bg-gray-400 hover:bg-gray-500'
                : mode === 'focus'
                ? 'bg-indigo-500 hover:bg-indigo-600'
                : 'bg-green-400 hover:bg-green-500'
            }`}
          >
            {running ? '⏸ 일시정지' : '▶ 시작'}
          </button>
        </div>

        {/* 세션 카운트 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 text-center">
          <p className="text-sm text-gray-400 mb-2">오늘 완료한 뽀모도로</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {Array.from({ length: Math.max(sessions, 4) }).map((_, i) => (
              <span
                key={i}
                className={`text-2xl transition ${i < sessions ? 'opacity-100' : 'opacity-20'}`}
              >
                🍅
              </span>
            ))}
          </div>
          <p className="text-2xl font-bold text-indigo-500 mt-2">{sessions}개</p>
        </div>

      </div>
    </main>
  )
}
