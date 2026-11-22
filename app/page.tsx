'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const [message, setMessage] = useState('')
  const [input, setInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // 페이지 로드 시 DB에서 문구 가져오기
  useEffect(() => {
    fetch('/api/message')
      .then((r) => r.json())
      .then((data) => {
        setMessage(data.message)
        setInput(data.message)
        setLoading(false)
      })
  }, [])

  // 저장 버튼 클릭
  const handleSave = async () => {
    if (!input.trim()) return
    setSaving(true)
    await fetch('/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input.trim() }),
    })
    setMessage(input.trim())
    setEditing(false)
    setSaving(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="text-center max-w-2xl mx-auto">

        {/* 이모지 */}
        <div className="text-7xl mb-8 animate-bounce">📚</div>

        {/* 메인 문구 — 편집 가능 */}
        {editing ? (
          <div className="mb-6 flex flex-col items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full max-w-md text-center text-2xl font-bold border-b-2 border-purple-400 bg-transparent outline-none py-2 text-gray-700"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-purple-500 text-white rounded-full text-sm font-semibold hover:bg-purple-600 disabled:opacity-50 transition"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => { setEditing(false); setInput(message) }}
                className="px-5 py-2 bg-gray-200 text-gray-600 rounded-full text-sm font-semibold hover:bg-gray-300 transition"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 group relative inline-block">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 leading-tight">
              {loading ? '불러오는 중...' : message}
            </h1>
            <button
              onClick={() => setEditing(true)}
              className="ml-3 text-gray-300 hover:text-purple-400 transition text-2xl align-middle"
              title="문구 수정"
            >
              ✏️
            </button>
          </div>
        )}

        {/* 서브 메시지 */}
        <p className="text-gray-500 text-lg mb-10">
          오늘도 한 걸음씩 🌱 꾸준히가 최고야 ✨
        </p>

        {/* 카드 3개 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Link href="/goals" className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
            <div className="text-3xl mb-2">🎯</div>
            <p className="font-semibold text-gray-700">목표 설정</p>
            <p className="text-sm text-gray-400 mt-1">오늘의 목표를 정해봐</p>
          </Link>
          <Link href="/focus" className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
            <div className="text-3xl mb-2">⏱️</div>
            <p className="font-semibold text-gray-700">집중 모드</p>
            <p className="text-sm text-gray-400 mt-1">25분 집중, 5분 휴식</p>
          </Link>
          <Link href="/achievements" className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
            <div className="text-3xl mb-2">🏆</div>
            <p className="font-semibold text-gray-700">성취 기록</p>
            <p className="text-sm text-gray-400 mt-1">오늘 한 것들을 기록해</p>
          </Link>
        </div>

        {/* 명언 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-600 italic text-base">
            &ldquo;성공은 매일 반복하는 작은 노력들의 합이다.&rdquo;
          </p>
          <p className="text-gray-400 text-sm mt-2">— Robert Collier</p>
        </div>

      </div>
    </main>
  )
}
