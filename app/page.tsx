export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="text-center max-w-2xl mx-auto">

        {/* 이모지 */}
        <div className="text-7xl mb-8 animate-bounce">📚</div>

        {/* 메인 타이틀 */}
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-4 leading-tight">
          서우야 공부 화이팅!
        </h1>

        {/* 서브 메시지 */}
        <p className="text-gray-500 text-lg mb-10">
          오늘도 한 걸음씩 🌱 꾸준히가 최고야 ✨
        </p>

        {/* 카드 3개 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-100">
            <div className="text-3xl mb-2">🎯</div>
            <p className="font-semibold text-gray-700">목표 설정</p>
            <p className="text-sm text-gray-400 mt-1">오늘의 목표를 정해봐</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
            <div className="text-3xl mb-2">⏱️</div>
            <p className="font-semibold text-gray-700">집중 모드</p>
            <p className="text-sm text-gray-400 mt-1">25분 집중, 5분 휴식</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
            <div className="text-3xl mb-2">🏆</div>
            <p className="font-semibold text-gray-700">성취 기록</p>
            <p className="text-sm text-gray-400 mt-1">오늘 한 것들을 기록해</p>
          </div>
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
  );
}
