'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Goal {
  id: string
  text: string
  done: boolean
  created_at: string
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const isComposingRef = useRef(false)

  // 목표 불러오기
  useEffect(() => {
    fetch('/api/goals')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGoals(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  // 목표 추가
  const addGoal = async () => {
    const text = input.trim()
    if (!text || submitting) return

    setSubmitting(true)
    setInput('') // 한글 조합 중복 및 연속 전송 방지를 위해 즉시 초기화

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('목표 저장 실패')
      const newGoal = await res.json()
      setGoals((prev) => [newGoal, ...prev])
    } catch (err) {
      console.error(err)
      setInput(text) // 전송 실패 시 기존 입력값 복구
    } finally {
      setSubmitting(false)
    }
  }

  // 엔터 키 처리 (한글 IME 완성 중 엔터는 무시)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.nativeEvent.isComposing || isComposingRef.current) return
      e.preventDefault()
      addGoal()
    }
  }

  // 완료 토글
  const toggleGoal = async (id: string, done: boolean) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, done: !done } : g)))
    await fetch(`/api/goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !done }),
    })
  }

  // 단일 삭제
  const deleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id))
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
  }

  // 완료 항목 일괄 삭제
  const clearDone = async () => {
    const doneIds = goals.filter((g) => g.done).map((g) => g.id)
    setGoals((prev) => prev.filter((g) => !g.done))
    await Promise.all(doneIds.map((id) => fetch(`/api/goals/${id}`, { method: 'DELETE' })))
  }

  const doneCount = goals.filter((g) => g.done).length

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 text-gray-900">
      <div className="max-w-lg mx-auto w-full">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-700 transition text-2xl p-1">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🎯 목표 설정</h1>
            <p className="text-xs sm:text-sm text-gray-500">오늘의 목표를 정하고 하나씩 지워봐</p>
          </div>
        </div>

        {/* 진행도 */}
        {goals.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100 mb-4 w-full">
            <div className="flex justify-between text-xs sm:text-sm text-gray-500 mb-2">
              <span>오늘의 진행도</span>
              <span className="font-bold text-indigo-600">{doneCount} / {goals.length}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / goals.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 입력 (모바일 폭 넘침 방지: min-w-0 flex-1 + flex-shrink-0) */}
        <div className="flex items-center gap-2 mb-4 w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { isComposingRef.current = true }}
            onCompositionEnd={() => { isComposingRef.current = false }}
            placeholder="목표를 입력하세요..."
            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-sm"
          />
          <button
            onClick={addGoal}
            disabled={submitting}
            className="flex-shrink-0 px-4 sm:px-5 py-3 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 active:scale-95 disabled:opacity-50 transition shadow-sm whitespace-nowrap"
          >
            {submitting ? '추가 중...' : '추가'}
          </button>
        </div>

        {/* 목표 리스트 */}
        <div className="flex flex-col gap-2.5">
          {loading && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3 animate-pulse">⏳</div>
              <p className="text-sm">불러오는 중...</p>
            </div>
          )}
          {!loading && goals.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🎯</div>
              <p className="text-sm font-medium">아직 목표가 없어요.</p>
              <p className="text-xs text-gray-400 mt-1">첫 번째 목표를 추가해보세요!</p>
            </div>
          )}
          {goals.map((goal) => (
            <div
              key={goal.id}
              className={`flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border transition w-full overflow-hidden ${
                goal.done ? 'border-green-100 bg-green-50/20 opacity-70' : 'border-gray-100'
              }`}
            >
              <button
                onClick={() => toggleGoal(goal.id, goal.done)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                  goal.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-indigo-400'
                }`}
              >
                {goal.done && <span className="text-xs font-bold">✓</span>}
              </button>
              <span className={`min-w-0 flex-1 text-sm break-words ${goal.done ? 'line-through text-gray-400' : 'text-gray-900 font-medium'}`}>
                {goal.text}
              </span>
              <button
                onClick={() => deleteGoal(goal.id)}
                className="text-gray-300 hover:text-red-500 transition text-lg flex-shrink-0 p-1"
                title="삭제"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {doneCount > 0 && (
          <button
            onClick={clearDone}
            className="mt-5 w-full text-xs text-gray-400 hover:text-red-500 transition py-2"
          >
            완료된 목표 일괄 삭제 ({doneCount}개)
          </button>
        )}
      </div>
    </main>
  )
}
