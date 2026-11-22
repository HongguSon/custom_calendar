'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CHECKLIST_CATEGORIES,
  TOTAL_CHECKLIST_ITEMS,
  ChecklistCategory,
} from '@/lib/checklistData'

interface ProgressItem {
  r1: boolean
  r2: boolean
  r3: boolean
}

// 회독 퍼센트 포맷 (예: 100, 150.5 등)
function formatPercent(num: number): string {
  if (num % 1 === 0) return `${Math.round(num)}%`
  return `${num.toFixed(1)}%`
}

export default function ChecklistPage() {
  const [progress, setProgress] = useState<Record<string, ProgressItem>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<ChecklistCategory | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 1. 초기 데이터 로드 (로컬스토리지 캐시 우선 로드 → DB 동기화)
  useEffect(() => {
    try {
      const cached = localStorage.getItem('checklist_progress_cache')
      if (cached) {
        setProgress(JSON.parse(cached))
      }
    } catch (e) {
      console.error(e)
    }

    fetch('/api/checklist')
      .then((r) => r.json())
      .then((data) => {
        if (data.progress && Object.keys(data.progress).length > 0) {
          setProgress((prev) => {
            const merged = { ...prev, ...data.progress }
            try {
              localStorage.setItem('checklist_progress_cache', JSON.stringify(merged))
            } catch (e) {}
            return merged
          })
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load checklist from DB:', err)
        setLoading(false)
      })
  }, [])

  // 2. 체크 토글 핸들러 (낙관적 UI + 로컬 캐시 + DB 영구 저장)
  const handleToggle = (itemId: string, round: 'r1' | 'r2' | 'r3') => {
    const current = progress[itemId] || { r1: false, r2: false, r3: false }
    const updatedItem = {
      ...current,
      [round]: !current[round],
    }

    const nextProgress = {
      ...progress,
      [itemId]: updatedItem,
    }

    setProgress(nextProgress)

    // 로컬스토리지 즉시 동기화
    try {
      localStorage.setItem('checklist_progress_cache', JSON.stringify(nextProgress))
    } catch (e) {}

    // Supabase DB 비동기 영구 저장
    fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: itemId,
        [round]: updatedItem[round],
      }),
    }).catch((err) => {
      console.error('DB update failed, kept in local cache:', err)
    })
  }

  // 3. 특정 과목의 진행 퍼센트 계산: (해당 과목의 총 체크 수 / 해당 과목 주제 수) * 100
  const getCategoryStats = (category: ChecklistCategory) => {
    let r1Count = 0
    let r2Count = 0
    let r3Count = 0

    for (const item of category.items) {
      const p = progress[item.id]
      if (p?.r1) r1Count++
      if (p?.r2) r2Count++
      if (p?.r3) r3Count++
    }

    const totalChecks = r1Count + r2Count + r3Count
    const percent = category.items.length > 0
      ? (totalChecks / category.items.length) * 100
      : 0

    return {
      r1Count,
      r2Count,
      r3Count,
      totalChecks,
      maxChecks: category.items.length * 3,
      percent,
      totalItems: category.items.length,
    }
  }

  // 4. 전체 회독 퍼센트 계산: (모든 체크 수 / 전체 297개 주제) * 100
  const totalCompletedChecks = Object.values(progress).reduce(
    (sum, p) => sum + (p.r1 ? 1 : 0) + (p.r2 ? 1 : 0) + (p.r3 ? 1 : 0),
    0
  )
  const totalPercent = (totalCompletedChecks / TOTAL_CHECKLIST_ITEMS) * 100

  // 1, 2, 3회독 각각의 전체 완료 수
  const totalR1 = Object.values(progress).filter((p) => p.r1).length
  const totalR2 = Object.values(progress).filter((p) => p.r2).length
  const totalR3 = Object.values(progress).filter((p) => p.r3).length

  // 검색 필터링된 대제목 목록
  const filteredCategories = CHECKLIST_CATEGORIES.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 text-gray-900 pb-16">
      <div className="max-w-3xl mx-auto w-full">

        {/* 최상단 네비게이션 헤더 */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            {selectedCategory ? (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-gray-500 hover:text-gray-900 transition text-sm font-semibold flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs"
              >
                <span>←</span>
                <span>전체 과목</span>
              </button>
            ) : (
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-900 transition text-sm font-semibold flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs"
              >
                <span>←</span>
                <span>홈으로</span>
              </Link>
            )}

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {selectedCategory ? (
                  <span className="flex items-center gap-1.5">
                    <span>{selectedCategory.icon}</span>
                    <span>{selectedCategory.title}</span>
                  </span>
                ) : (
                  '📚 필기 N회독 마일스톤'
                )}
              </h1>
            </div>
          </div>

          {/* 전체 진도 배지 */}
          <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-2xl border border-purple-200 shadow-2xs">
            <span className="text-[11px] font-bold text-gray-500">전체 누적</span>
            <span className="text-sm font-black text-rose-500 tabular-nums">
              {formatPercent(totalPercent)}
            </span>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* VIEW 1: 전체 대제목 그리드 뷰 (selectedCategory === null)     */}
        {/* ---------------------------------------------------------- */}
        {!selectedCategory && (
          <div>
            {/* 전체 진행률 대시보드 배너 */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-purple-100 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <span className="inline-block text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full mb-1">
                    의사국가고시 / 필기 총 297개 주제
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-baseline gap-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600">
                      {formatPercent(totalPercent)}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">
                      (총 {totalCompletedChecks} / {TOTAL_CHECKLIST_ITEMS * 3} 체크)
                    </span>
                  </h2>
                </div>

                {/* 1회독, 2회독, 3회독 서머리 미니 카드 3개 */}
                <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                  <div className="bg-indigo-50/60 rounded-xl p-2.5 text-center border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-500">1회독</p>
                    <p className="text-sm font-black text-indigo-700 tabular-nums">
                      {Math.round((totalR1 / TOTAL_CHECKLIST_ITEMS) * 100)}%
                    </p>
                    <p className="text-[9px] text-indigo-400">{totalR1}/{TOTAL_CHECKLIST_ITEMS}</p>
                  </div>
                  <div className="bg-purple-50/60 rounded-xl p-2.5 text-center border border-purple-100">
                    <p className="text-[10px] font-bold text-purple-500">2회독</p>
                    <p className="text-sm font-black text-purple-700 tabular-nums">
                      {Math.round((totalR2 / TOTAL_CHECKLIST_ITEMS) * 100)}%
                    </p>
                    <p className="text-[9px] text-purple-400">{totalR2}/{TOTAL_CHECKLIST_ITEMS}</p>
                  </div>
                  <div className="bg-rose-50/60 rounded-xl p-2.5 text-center border border-rose-100">
                    <p className="text-[10px] font-bold text-rose-500">3회독</p>
                    <p className="text-sm font-black text-rose-700 tabular-nums">
                      {Math.round((totalR3 / TOTAL_CHECKLIST_ITEMS) * 100)}%
                    </p>
                    <p className="text-[9px] text-rose-400">{totalR3}/{TOTAL_CHECKLIST_ITEMS}</p>
                  </div>
                </div>
              </div>

              {/* 전체 300% 기준 프로그레스 바 */}
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden p-0.5 border border-gray-200/60">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((totalPercent / 300) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 mt-2 font-medium">
                <span>0%</span>
                <span>1회독 (100%)</span>
                <span>2회독 (200%)</span>
                <span>3회독 완벽 정복 (300%)</span>
              </div>
            </div>

            {/* 과목 검색 인풋 */}
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="과목 검색 (예: 순환기, 소아과, 법규...)"
                className="w-full rounded-2xl border border-gray-200 bg-white/90 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition shadow-2xs"
              />
            </div>

            {/* 대제목 아이콘 카드 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
              {filteredCategories.map((category) => {
                const stats = getCategoryStats(category)
                return (
                  <div
                    key={category.id}
                    onClick={() => setSelectedCategory(category)}
                    className="group relative bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-visible active:scale-98"
                  >
                    {/* 우측 상단 아이폰 알림 스타일 퍼센트 배지 */}
                    <div className="absolute -top-2.5 -right-2.5 z-10">
                      <span className="inline-flex items-center justify-center bg-rose-500 text-white text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-md border-2 border-white tabular-nums tracking-tight">
                        {formatPercent(stats.percent)}
                      </span>
                    </div>

                    {/* 아이콘 + 대제목 */}
                    <div>
                      <div className="text-3xl sm:text-4xl mb-2 sm:mb-2.5 transition group-hover:scale-110 duration-200">
                        {category.icon}
                      </div>
                      <h3 className="font-extrabold text-gray-900 text-base sm:text-lg tracking-tight group-hover:text-purple-600 transition">
                        {category.title}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        {category.items.length}개 주제
                      </p>
                    </div>

                    {/* 과목 내 1/2/3회독 미니 게이지 바 */}
                    <div className="mt-4 pt-3 border-t border-gray-50">
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((stats.percent / 300) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1.5 font-medium">
                        <span>진도</span>
                        <span className="font-bold text-gray-600">{stats.totalChecks} / {stats.maxChecks}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {/* VIEW 2: 대제목 클릭 시 진입하는 상세 소제목 회독 체크리스트    */}
        {/* ---------------------------------------------------------- */}
        {selectedCategory && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-purple-100 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* 과목 상세 헤더 */}
            {(() => {
              const stats = getCategoryStats(selectedCategory)
              return (
                <div className="pb-5 mb-5 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl sm:text-5xl">{selectedCategory.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-black text-gray-900">
                            {selectedCategory.title}
                          </h2>
                          {/* 아이폰 알림 스타일 퍼센트 배지 */}
                          <span className="bg-rose-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm border border-white tabular-nums">
                            {formatPercent(stats.percent)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          총 {stats.totalItems}개 주제 • 전체 회독 달성도 {stats.totalChecks} / {stats.maxChecks} 체크
                        </p>
                      </div>
                    </div>

                    {/* 회독별 완료 요약 칩 */}
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                        1회독: {stats.r1Count}/{stats.totalItems}
                      </span>
                      <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-100">
                        2회독: {stats.r2Count}/{stats.totalItems}
                      </span>
                      <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-100">
                        3회독: {stats.r3Count}/{stats.totalItems}
                      </span>
                    </div>
                  </div>

                  {/* 프로그레스 바 */}
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((stats.percent / 300) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })()}

            {/* 테이블 헤더: 소제목 (좌측) | 1회독, 2회독, 3회독 (우측) */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50/80 rounded-2xl mb-2 text-xs font-bold text-gray-600">
              <span className="flex-1">소제목 / 학습 주제</span>
              <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0 text-center font-extrabold pr-1">
                <span className="w-10 sm:w-12 text-indigo-600">1회독</span>
                <span className="w-10 sm:w-12 text-purple-600">2회독</span>
                <span className="w-10 sm:w-12 text-rose-600">3회독</span>
              </div>
            </div>

            {/* 소제목 리스트 */}
            <div className="divide-y divide-gray-100">
              {selectedCategory.items.map((item, idx) => {
                const p = progress[item.id] || { r1: false, r2: false, r3: false }
                const isAllDone = p.r1 && p.r2 && p.r3

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between py-3.5 px-3 rounded-2xl transition hover:bg-gray-50/80 ${
                      isAllDone ? 'bg-purple-50/30' : ''
                    }`}
                  >
                    {/* 소제목 텍스트 */}
                    <div className="flex-1 pr-3 min-w-0">
                      <p className={`text-sm font-semibold leading-snug break-words ${
                        isAllDone ? 'text-purple-900 font-bold' : 'text-gray-800'
                      }`}>
                        {item.title}
                      </p>
                    </div>

                    {/* 1회독, 2회독, 3회독 체크박스 3개 */}
                    <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                      {/* 1회독 체크박스 */}
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id, 'r1')}
                        className={`w-10 sm:w-12 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition active:scale-90 ${
                          p.r1
                            ? 'bg-indigo-500 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-300 hover:bg-indigo-50 hover:text-indigo-400 border border-gray-200/60'
                        }`}
                        title="1회독 완료 체크"
                      >
                        {p.r1 ? '✓' : '1'}
                      </button>

                      {/* 2회독 체크박스 */}
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id, 'r2')}
                        className={`w-10 sm:w-12 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition active:scale-90 ${
                          p.r2
                            ? 'bg-purple-500 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-300 hover:bg-purple-50 hover:text-purple-400 border border-gray-200/60'
                        }`}
                        title="2회독 완료 체크"
                      >
                        {p.r2 ? '✓' : '2'}
                      </button>

                      {/* 3회독 체크박스 */}
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id, 'r3')}
                        className={`w-10 sm:w-12 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition active:scale-90 ${
                          p.r3
                            ? 'bg-rose-500 text-white shadow-xs ring-2 ring-rose-200'
                            : 'bg-gray-100 text-gray-300 hover:bg-rose-50 hover:text-rose-400 border border-gray-200/60'
                        }`}
                        title="3회독 완료 체크"
                      >
                        {p.r3 ? '✓' : '3'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 하단 전체 과목으로 돌아가기 버튼 */}
            <div className="mt-8 pt-4 border-t border-gray-100 text-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition"
              >
                ← 전체 과목 목록으로 이동
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
