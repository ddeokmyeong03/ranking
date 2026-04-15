# 육군 간부 당직근무표 변경 시스템

육군 간부 전용 당직근무 관리 웹 애플리케이션입니다.
당직근무 자동 편성, 근무 교환 요청, 수당 계산 기능을 제공합니다.

---

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (jose) + bcrypt, HTTP-only 쿠키
- **UI**: Tailwind CSS + lucide-react

---

## 주요 기능

### 사용자
- **2단계 로그인**: 군번+비밀번호 → 부대코드 인증
- **자동 로그인**: 신뢰 기기 등록 (30일)
- **월별 달력**: 부대 전체 당직근무표 조회 (본인 근무 강조)
- **변경 희망 게시**: 바꿔줄 사람 모집 → 달력 오렌지 표시
- **변경 신청/승인**: 상호 승인 시 자동 스왑
- **직접 변경 요청**: 특정 날짜 근무자에게 교환 요청
- **수당 계산**: 이달 근무별 수당 자동 계산
- **실시간 알림**: SSE 기반 미읽음 알림 뱃지

### 관리자
- **사이클 생성**: 편성 순서 지정 → 자동 배정 실행
- **공휴일/전투휴무 등록**: 전투휴무 시 평일 당직 → 주말 당직 자동 전환
- **간부 관리**: 역할(관리자/일반) 및 활성화 상태 설정
- **수당 요율 설정**: 근무 유형별 금액 등록

---

## 시작하기

### 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 필수 항목:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
SESSION_SECRET=your-secret-key-here
TEMP_SESSION_SECRET=your-temp-secret-key-here
```

### 설치 및 실행

```bash
npm install

# DB 마이그레이션
npx prisma migrate dev --name init

# 테스트 데이터 입력
npm run seed

# 개발 서버 실행
npm run dev
```

### 테스트 계정 (seed 후)

| 역할 | 군번 | 비밀번호 | 부대코드 |
|------|------|----------|----------|
| 관리자 | 22-00000001 | admin1234 | TEST01 |
| 일반 | 22-00000002 | password1234 | TEST01 |
| 일반 | 22-00000003 | password1234 | TEST01 |
| 일반 | 22-00000004 | password1234 | TEST01 |
| 일반 | 22-00000005 | password1234 | TEST01 |

---

## 페이지 구조

```
/login                  로그인 Step1 (군번+비밀번호)
/login/unit-code        로그인 Step2 (부대코드)
/signup                 회원가입 / 부대 생성
/dashboard              사용자 홈
/schedule               월별 당직근무표
/listings               변경 희망 게시글 목록
/my-listings            내 게시글 + 받은 신청 관리
/requests               당직 변경 요청 관리
/allowance              이달 수당 계산
/profile                프로필 수정
/notifications          알림 전체 목록
/admin                  관리자 대시보드
/admin/members          간부 관리
/admin/cycles           사이클 관리
/admin/cycles/new       사이클 생성
/admin/schedule         근무표 (관리자)
/admin/holidays         공휴일/전투휴무 관리
/admin/allowances       수당 요율 설정
```

---

## 자동 편성 알고리즘

- 날짜를 평일 / 주말(공휴일·전투휴무 포함)로 분류
- 주말 = 주간 + 야간 2슬롯, 평일 = 1슬롯
- 공정성 가중 라운드로빈: 각 근무 유형 횟수 적은 멤버 우선 배정
- 동일 날짜 중복 배정 방지

---

## 구현 완료 현황

- [x] Phase 1: DB 스키마 + 2단계 인증 + 관리자 간부 관리
- [x] Phase 2: 자동 편성 알고리즘 + 달력 UI + 공휴일 관리
- [x] Phase 3: 당직 변경 플로우 + 실시간 알림 (SSE)
- [x] Phase 4: 수당 계산 + 프로필 수정
