# my-webapp

Next.js + TypeScript + Tailwind CSS 기반 웹앱.  
Vercel 무료 티어로 배포 → `xxx.vercel.app` 주소 자동 발급.

## 🚀 로컬 개발

```bash
npm install
npm run dev
# → http://localhost:3000
```

## 📦 배포 (최초 1회 세팅)

### 1. GitHub 레포 생성 & Push

```bash
# GitHub에서 새 레포 생성 후 (예: my-webapp)
git remote add origin https://github.com/<your-username>/my-webapp.git
git branch -M main
git push -u origin main
```

### 2. Vercel 연동

1. [vercel.com](https://vercel.com) → 로그인 (GitHub 계정 사용)
2. **"Add New Project"** → GitHub 레포 선택
3. 설정 그대로 두고 **"Deploy"** 클릭
4. 완료! → `https://my-webapp-xxx.vercel.app` 주소 발급

### 3. 이후 배포 (자동)

```bash
git add .
git commit -m "feat: 변경사항"
git push
# → Vercel이 자동으로 감지해서 재배포
```

## ⚙️ CI/CD 파이프라인

| 트리거 | 동작 |
|--------|------|
| `push` to `main` | Lint + Build 자동 실행 |
| Pull Request | Lint + Build 체크 + Vercel Preview URL 생성 |

## 🗂️ 프로젝트 구조

```
my-webapp/
├── app/
│   ├── layout.tsx     # 루트 레이아웃
│   ├── page.tsx       # 메인 페이지
│   └── globals.css    # 글로벌 스타일
├── public/            # 정적 파일
├── .github/
│   └── workflows/
│       └── ci.yml     # GitHub Actions CI
└── next.config.ts
```
