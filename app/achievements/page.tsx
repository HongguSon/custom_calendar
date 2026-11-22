'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Achievement {
  id: string
  text: string
  emoji: string
  image_url?: string | null
  created_at: string
}

const EMOJIS = ['🏆', '⭐', '🎉', '💪', '🔥', '✅', '📖', '🧠']
const MAX_IMAGE_SIZE = 20 * 1024 * 1024 // 20MB

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [input, setInput] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🏆')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  const isComposingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // 성취 불러오기
  useEffect(() => {
    fetch('/api/achievements')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAchievements(data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  // 이미지 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 20MB 크기 제한 검사
    if (file.size > MAX_IMAGE_SIZE) {
      alert('이미지 파일 크기는 최대 20MB까지만 가능합니다.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      return
    }

    // 이미지 형식 검사
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(JPG, PNG, GIF, WEBP 등)만 선택할 수 있습니다.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  // 선택된 이미지 취소
  const handleRemoveSelectedFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  // 성취 추가
  const addAchievement = async () => {
    const text = input.trim()
    if (!text || submitting) return

    setSubmitting(true)
    const currentFile = selectedFile
    setInput('') // 즉시 비워 중복 입력 방지
    handleRemoveSelectedFile()

    try {
      let uploadedImageUrl: string | null = null

      // 이미지 파일이 있으면 먼저 스토리지에 업로드
      if (currentFile) {
        const formData = new FormData()
        formData.append('file', currentFile)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          const errData = await uploadRes.json()
          throw new Error(errData.error || '이미지 업로드에 실패했습니다.')
        }

        const uploadData = await uploadRes.json()
        uploadedImageUrl = uploadData.url
      }

      // 성취 기록 저장
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          emoji: selectedEmoji,
          image_url: uploadedImageUrl,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || '성취 기록 저장 실패')
      }

      const newItem = await res.json()
      setAchievements((prev) => [newItem, ...prev])
    } catch (err: any) {
      alert(err.message || '저장 중 오류가 발생했습니다.')
      setInput(text) // 실패 시 입력 텍스트 복구
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 text-gray-900">
      <div className="max-w-lg mx-auto w-full">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-700 transition text-2xl p-1">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏆 성취 기록</h1>
            <p className="text-xs sm:text-sm text-gray-500">오늘 한 것들을 사진과 함께 기록해봐</p>
          </div>
        </div>

        {/* 이모지 선택 */}
        <div className="w-full mb-4">
          <div className="flex items-center justify-between gap-1.5 overflow-x-auto p-2 bg-white/80 rounded-2xl border border-purple-100 shadow-2xs [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setSelectedEmoji(e)}
                type="button"
                className={`text-xl rounded-xl p-2 sm:p-2.5 transition-all flex-shrink-0 flex items-center justify-center ${
                  selectedEmoji === e
                    ? 'bg-purple-100 scale-105 shadow-xs ring-2 ring-purple-400'
                    : 'bg-white hover:bg-gray-50 border border-gray-200/60 active:scale-95'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* 입력 카드 */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-purple-100 mb-6 w-full overflow-hidden">
          {/* 입력창 + 등록 버튼 (모바일 폭 넘침 방지) */}
          <div className="flex items-center gap-2 w-full mb-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => { isComposingRef.current = true }}
              onCompositionEnd={() => { isComposingRef.current = false }}
              placeholder="오늘 이룬 것을 기록해봐..."
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition"
            />
            <button
              onClick={addAchievement}
              disabled={submitting}
              className="flex-shrink-0 px-4 sm:px-5 py-3 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 active:scale-95 disabled:opacity-50 transition shadow-sm whitespace-nowrap"
            >
              {submitting ? '기록 중...' : '기록'}
            </button>
          </div>

          {/* 사진 첨부 숨김 인풋 */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* 사진 첨부 2버튼 그리드 (모바일 친화적) */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-purple-50 hover:text-purple-700 border border-gray-200 hover:border-purple-300 rounded-xl transition active:scale-95 shadow-2xs"
            >
              <span className="text-base">🖼️</span>
              <span>앨범 / 갤러리</span>
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-purple-50 hover:text-purple-700 border border-gray-200 hover:border-purple-300 rounded-xl transition active:scale-95 shadow-2xs"
            >
              <span className="text-base">📸</span>
              <span>카메라 촬영</span>
            </button>
          </div>

          {/* 선택한 이미지 미리보기 바 */}
          {previewUrl && (
            <div className="mt-3 p-2.5 bg-purple-50/70 rounded-xl border border-purple-200 flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={previewUrl}
                  alt="미리보기"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg border border-purple-300 flex-shrink-0 shadow-xs"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-purple-900 truncate">
                    {selectedFile?.name || '선택된 사진'}
                  </p>
                  <p className="text-[11px] text-purple-600 mt-0.5">
                    {selectedFile && (selectedFile.size / (1024 * 1024)).toFixed(1)} MB (최대 20MB)
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveSelectedFile}
                type="button"
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition"
                title="취소"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* 총 개수 */}
        {achievements.length > 0 && (
          <p className="text-xs sm:text-sm text-gray-500 mb-3 px-1">
            총 <span className="font-bold text-purple-600">{achievements.length}개</span>의 성취 기록
          </p>
        )}

        {/* 기록 리스트 */}
        <div className="flex flex-col gap-3">
          {loading && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3 animate-pulse">⏳</div>
              <p className="text-sm">불러오는 중...</p>
            </div>
          )}
          {!loading && achievements.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🏆</div>
              <p className="text-sm font-medium">아직 기록이 없어요.</p>
              <p className="text-xs text-gray-400 mt-1">사진과 함께 오늘 한 첫 성취를 남겨봐요!</p>
            </div>
          )}
          {achievements.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition hover:shadow-md w-full overflow-hidden"
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 break-words leading-relaxed">{item.text}</p>
                {item.image_url && (
                  <div className="mt-2.5 w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                    <img
                      src={item.image_url}
                      alt="성취 인증 사진"
                      onClick={() => setLightboxImage(item.image_url || null)}
                      className="w-full max-h-72 object-cover cursor-pointer hover:opacity-95 transition"
                    />
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-2">{formatDate(item.created_at)}</p>
              </div>
              <button
                onClick={() => deleteAchievement(item.id)}
                className="text-gray-300 hover:text-red-500 transition text-lg flex-shrink-0 p-1"
                title="삭제"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* 이미지 원본 확대 모달 (라이트박스) */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setLightboxImage(null)}
          >
            <div className="relative max-w-3xl max-h-[90vh]">
              <img
                src={lightboxImage}
                alt="확대 보기"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 bg-white/80 hover:bg-white text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm transition shadow-md"
              >
                ✕
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
