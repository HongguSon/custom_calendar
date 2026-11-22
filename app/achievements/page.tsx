'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Achievement {
  id: string
  text: string
  emoji: string
  created_at: string
}

const EMOJIS = ['🏆', '⭐', '🎉', '💪', '🔥', '✅', '📖', '🧠']

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [input, setInput] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🏆')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const isComposingRef = useRef(false)

  // 성취 불러오기
  useEffect(() => {
    fetch('/api/achievements')
      .then((r) => r.json())
      .then((data) => { setAchievements(data); setLoading(false) })
  }, [])

  // 성취 추가
  const addAchievement = async () => {
    const text = input.trim()
    if (!text || submitting) return

    setSubmitting(true)
    setInput('') // 입력창 즉시 비우기 (중복 입력 방지)

    try {
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, emoji: selectedEmoji }),
      })
      if (!res.ok) throw new Error('성취 기록 저장 실패')
      const newItem = await res.json()
      setAchievements((prev) => [newItem, ...prev])
    } catch (err) {
      console.error(err)
      setInput(text) // 실패 시 복구
    } finally {
      setSubmitting(false)
    }
  }

  // 엔터 키 처리 (한글 조합 중 엔터 무시)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.nativeEvent.isComposing || isComposingRef.current) return
      e.preventDefault()
      addAchievement()
    }
  }

  // 삭제
  const deleteAchievement = async (id: string) => {
    setAchievements((prev) => prev.filter((a) => a.id !== id))
    await fetch(`/api/achievements/${id}`, { method: 'DELETE' })
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('ko-KR', {
      month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-lg mx-auto">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition text-2xl">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🏆 성취 기록</h1>
            <p className="text-sm text-gray-400">오늘 한 것들을 기록해봐</p>
          </div>
        </div>

        {/* 이모지 선택 */}
        <div className="flex gap-2 mb-3">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setSelectedEmoji(e)}
              className={`text-xl rounded-xl p-2 transition ${
                selectedEmoji === e ? 'bg-purple-100 scale-110' : 'bg-white hover:bg-gray-50'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* 입력 */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { isComposingRef.current = true }}
            onCompositionEnd={() => { isComposingRef.current = false }}
            placeholder="오늘 이룬 것을 기록해봐..."
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-400 transition bg-white shadow-sm"
          />
          <button
            onClick={addAchievement}
            disabled={submitting}
            className="px-5 py-3 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 disabled:opacity-50 transition shadow-sm"
          >
            {submitting ? '기록 중...' : '기록'}
          </button>
        </div>

        {/* 총 개수 */}
        {achievements.length > 0 && (
          <p className="text-sm text-gray-400 mb-3">
            총 <span className="font-semibold text-purple-500">{achievements.length}개</span>의 성취 기록
          </p>
        )}

        {/* 기록 리스트 */}
        <div className="flex flex-col gap-3">
          {loading && (
            <div className="text-center py-16 text-gray-300">
              <div className="text-4xl mb-3 animate-pulse">⏳</div>
              <p className="text-sm">불러오는 중...</p>
            </div>
          )}
          {!loading && achievements.length === 0 && (
            <div className="text-center py-16 text-gray-300">
              <div className="text-5xl mb-3">🏆</div>
              <p className="text-sm">아직 기록이 없어요. 오늘 한 것을 기록해봐요!</p>
            </div>
          )}
          {achievements.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100"
            >
              <span className="text-2xl flex-shrink-0">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">{item.text}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(item.created_at)}</p>
              </div>
              <button
                onClick={() => deleteAchievement(item.id)}
                className="text-gray-200 hover:text-red-400 transition text-lg flex-shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
