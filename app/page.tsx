'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function Home() {
  const [message, setMessage] = useState('')
  const [input, setInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const isComposingRef = useRef(false)

  // 페이지 로드 시 DB에서 문구 가져오기
  useEffect(() => {
    fetch('/api/message')
      .then((r) => r.json())
      .then((data) => {
        setMessage(data.message)
        setInput(data.message)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  // 저장 버튼 클릭
  const handleSave = async () => {
    const text = input.trim()
    if (!text || saving) return
    setSaving(true)
    try {
      await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      setMessage(text)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.nativeEvent.isComposing || isComposingRef.current) return
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 sm:p-6 text-gray-900">
      <div className="text-center max-w-2xl mx-auto w-full">

        {/* 이모지 */}
        <div className="text-6xl sm:text-7xl mb-6 sm:mb-8 animate-bounce">📚</div>

        {/* 메인 문구 — 편집 가능 */}
        {editing ? (
          <div className="mb-6 flex flex-col items-center gap-3 w-full px-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => { isComposingRef.current = true }}
              onCompositionEnd={() => { isComposingRef.current = false }}
              className="w-full max-w-md text-center text-xl sm:text-2xl font-bold border-b-2 border-purple-500 bg-white/80 rounded-t-lg outline-none py-2 px-3 text-gray-900 placeholder:text-gray-400"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-purple-500 text-white rounded-full text-sm font-semibold hover:bg-purple-600 active:scale-95 disabled:opacity-50 transition shadow-sm"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => { setEditing(false); setInput(message) }}
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold hover:bg-gray-300 transition"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 sm:mb-6 group relative inline-flex items-center justify-center flex-wrap px-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 leading-tight">
              {loading ? '불러오는 중...' : message}
            </h1>
            <button
              onClick={() => setEditing(true)}
              className="ml-2 sm:ml-3 text-gray-400 hover:text-purple-600 transition text-xl sm:text-2xl p-1"
              title="문구 수정"
            >
              ✏️
            </button>
          </div>
        )}

        {/* 서브 메시지 */}
        <p className="text-gray-500 text-sm sm:text-base mb-8 sm:mb-10">
          오늘도 한 걸음씩 🌱 꾸준히가 최고야 ✨
        </p>

        {/* 카드 3개 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-8 sm:mb-10 text-left sm:text-center">
          <Link href="/goals" className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-indigo-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex sm:flex-col items-center gap-3.5 sm:gap-0">
            <div className="text-3xl mb-0 sm:mb-2 flex-shrink-0">🎯</div>
            <div>
              <p className="font-bold text-gray-900 text-base">목표 설정</p>
              <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">오늘의 목표를 정해봐</p>
            </div>
          </Link>
          <Link href="/focus" className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex sm:flex-col items-center gap-3.5 sm:gap-0">
            <div className="text-3xl mb-0 sm:mb-2 flex-shrink-0">⏱️</div>
            <div>
              <p className="font-bold text-gray-900 text-base">집중 모드</p>
              <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">25분 집중, 5분 휴식</p>
            </div>
          </Link>
          <Link href="/achievements" className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-pink-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex sm:flex-col items-center gap-3.5 sm:gap-0">
            <div className="text-3xl mb-0 sm:mb-2 flex-shrink-0">🏆</div>
            <div>
              <p className="font-bold text-gray-900 text-base">성취 기록</p>
              <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">오늘 한 것들을 기록해</p>
            </div>
          </Link>
        </div>

        {/* 명언 */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 mx-auto max-w-lg">
          <p className="text-gray-700 italic text-sm sm:text-base font-medium">
            &ldquo;성공은 매일 반복하는 작은 노력들의 합이다.&rdquo;
          </p>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">— Robert Collier</p>
        </div>

      </div>
    </main>
  )
}
