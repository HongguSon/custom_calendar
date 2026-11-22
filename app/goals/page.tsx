'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Goal {
  id: string
  text: string
  done: boolean
  createdAt: string
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [input, setInput] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('goals')
    if (saved) setGoals(JSON.parse(saved))
  }, [])

  const save = (updated: Goal[]) => {
    setGoals(updated)
    localStorage.setItem('goals', JSON.stringify(updated))
  }

  const addGoal = () => {
    if (!input.trim()) return
    const newGoal: Goal = {
      id: Date.now().toString(),
      text: input.trim(),
      done: false,
      createdAt: new Date().toLocaleDateString('ko-KR'),
    }
    save([newGoal, ...goals])
    setInput('')
  }

  const toggleGoal = (id: string) =>
    save(goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)))

  const deleteGoal = (id: string) =>
    save(goals.filter((g) => g.id !== id))

  const clearDone = () => save(goals.filter((g) => !g.done))

  const doneCount = goals.filter((g) => g.done).length

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-lg mx-auto">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition text-2xl">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🎯 목표 설정</h1>
            <p className="text-sm text-gray-400">오늘의 목표를 정해봐</p>
          </div>
        </div>

        {/* 진행도 */}
        {goals.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100 mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>오늘의 진행도</span>
              <span className="font-semibold text-indigo-500">{doneCount} / {goals.length}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                style={{ width: goals.length ? `${(doneCount / goals.length) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}

        {/* 입력 */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
            placeholder="목표를 입력하세요..."
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 transition bg-white shadow-sm"
          />
          <button
            onClick={addGoal}
            className="px-5 py-3 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition shadow-sm"
          >
            추가
          </button>
        </div>

        {/* 목표 리스트 */}
        <div className="flex flex-col gap-2">
          {goals.length === 0 && (
            <div className="text-center py-16 text-gray-300">
              <div className="text-5xl mb-3">🎯</div>
              <p className="text-sm">아직 목표가 없어요. 첫 목표를 추가해봐요!</p>
            </div>
          )}
          {goals.map((goal) => (
            <div
              key={goal.id}
              className={`flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border transition ${
                goal.done ? 'border-green-100 opacity-60' : 'border-gray-100'
              }`}
            >
              <button
                onClick={() => toggleGoal(goal.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                  goal.done ? 'bg-green-400 border-green-400 text-white' : 'border-gray-300'
                }`}
              >
                {goal.done && '✓'}
              </button>
              <span className={`flex-1 text-sm text-gray-700 ${goal.done ? 'line-through text-gray-400' : ''}`}>
                {goal.text}
              </span>
              <button
                onClick={() => deleteGoal(goal.id)}
                className="text-gray-200 hover:text-red-400 transition text-lg"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* 완료 항목 삭제 */}
        {doneCount > 0 && (
          <button
            onClick={clearDone}
            className="mt-4 w-full text-sm text-gray-400 hover:text-red-400 transition py-2"
          >
            완료된 목표 삭제 ({doneCount}개)
          </button>
        )}
      </div>
    </main>
  )
}
