'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Code2, Database, Layout, Server, GitBranch, AlertCircle, CheckCircle2, Layers, Zap } from 'lucide-react';

/* ─── 섹션 토글 카드 ─── */
function Section({ icon: Icon, title, badge, badgeColor = 'bg-primary', children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon size={16} className="text-primary" />
          </div>
          <span className="font-bold text-gray-800 text-sm">{title}</span>
          {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${badgeColor}`}>{badge}</span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="border-t border-gray-100 px-5 py-4 space-y-4">{children}</div>}
    </div>
  );
}

/* ─── 코드 블록 ─── */
function CodeBlock({ title, code, lang = 'json' }) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      {title && (
        <div className="bg-gray-100 px-3 py-1.5 flex items-center gap-2 border-b border-gray-200">
          <Code2 size={12} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-500">{title}</span>
        </div>
      )}
      <pre className="bg-gray-50 px-4 py-3 text-xs text-gray-700 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

/* ─── 정보 표 ─── */
function InfoTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-gray-50 last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-gray-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── 태그 ─── */
function Tag({ children, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-600',
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
}

/* ─── 메인 컴포넌트 ─── */
export default function DevGuide() {
  return (
    <div className="space-y-4 pb-8">
      {/* 상단 배너 */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-5 text-white">
        <div className="flex items-start gap-3">
          <GitBranch size={28} className="shrink-0 mt-0.5 opacity-80" />
          <div>
            <h1 className="text-lg font-extrabold mb-1">개발팀 가이드 — 산업안전보건관리비 예산관리 시스템</h1>
            <p className="text-sm opacity-80 leading-relaxed">
              현재 구현된 프로토타입(Next.js + localStorage)을 기반으로 실제 서비스(백엔드 API + DB 연동)로 전환할 때
              프론트엔드·백엔드 개발팀이 참고해야 할 아키텍처, 데이터 구조, API 설계, 주요 비즈니스 로직을 정리합니다.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Tag color="primary">Next.js 14 App Router</Tag>
              <Tag color="blue">React Context</Tag>
              <Tag color="green">Recharts</Tag>
              <Tag color="amber">Tailwind CSS</Tag>
              <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-white">현재: localStorage 기반 프로토타입</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. 시스템 개요 */}
      <Section icon={Layers} title="1. 시스템 개요 및 핵심 기능" defaultOpen>
        <p className="text-sm text-gray-600 leading-relaxed">
          이 시스템은 <strong>건설현장</strong>과 <strong>일반사업장</strong> 두 모드를 지원하는
          산업안전보건관리비 예산 수립·집행·분석 통합 관리 도구입니다.
        </p>
        <InfoTable
          headers={['탭', '기능', '모드 구분']}
          rows={[
            ['예산총괄', '예산·집행 현황 대시보드, 항목별·관계사별 요약', '건설/일반 별도 레이아웃'],
            ['예산수립', '연도별·전체기간 예산 편성, 안전관리비 계상 계산기', '건설: 법정 9개 항목 / 일반: 자유 항목'],
            ['집행실적', '월별 집행 입력, 연도/전체기간 요약, 증빙 첨부', '건설: 법정 카테고리 / 일반: 자유 항목'],
            ['통계분석', '월별 추이, 연도별 비교, 항목별·관계사별 차트', '공통 (데이터 소스만 분기)'],
            ['회사관리', '원도급사·협력사 등록, 마스터 회사 목록 관리', '건설/일반 분리 관리'],
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs font-bold text-blue-700 mb-2">🏗️ 건설현장 모드</p>
            <ul className="text-xs text-blue-700 space-y-1 leading-relaxed">
              <li>• 법정 9개 항목(C01~C09) 고정 카테고리</li>
              <li>• 전체기간/년도별 기간 선택 모두 지원</li>
              <li>• 총공사금액 기반 안전관리비 계상액 계산기</li>
              <li>• 원도급 포함 옵션 (협력사 집행액 합산)</li>
              <li>• 보고서 생성·승인 워크플로우</li>
            </ul>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4">
            <p className="text-xs font-bold text-emerald-700 mb-2">🏢 일반사업장 모드</p>
            <ul className="text-xs text-emerald-700 space-y-1 leading-relaxed">
              <li>• 자유 항목명으로 예산·집행 입력</li>
              <li>• 년도별 기간만 지원 (전체기간 비활성)</li>
              <li>• 총 매출액 기반 안전관리비 비율 표시</li>
              <li>• 일반사업장 전용 회사 목록 별도 관리</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* 2. 프론트엔드 아키텍처 */}
      <Section icon={Layout} title="2. 프론트엔드 아키텍처" badge="Frontend">
        <p className="text-sm font-semibold text-gray-700 mb-2">디렉토리 구조</p>
        <CodeBlock
          code={`safety-budget/
├── app/
│   ├── page.js              # 루트 페이지 (BudgetProvider 래핑, 탭 라우팅)
│   ├── layout.js            # HTML 루트 레이아웃
│   └── globals.css          # Tailwind 기반 전역 스타일
│
├── components/
│   ├── tabs/                # 각 탭 페이지 컴포넌트
│   │   ├── BudgetOverview.js      # 예산총괄 (ConstructionOverview / GeneralOverview 분기)
│   │   ├── BudgetPlan.js          # 예산수립 + 계상 계산기
│   │   ├── ExecutionRecord.js     # 집행실적 + 모달들 (MonthView, Edit, Evidence)
│   │   ├── Statistics.js          # 통계분석 (Recharts 차트 5종)
│   │   ├── CompanyManagement.js   # 회사관리
│   │   ├── SafetyBudgetCalculatorModal.js  # 안전관리비 계상 계산기 모달
│   │   └── DevGuide.js            # 개발팀 가이드 (이 페이지)
│   │
│   ├── layout/
│   │   └── CompanySummary.js      # 관계사별 예산·집행 현황 (헤더 공통 위젯)
│   │
│   ├── execution/
│   │   └── DetailEntryModal.js    # 항목별 건별 상세 입력 모달
│   │
│   └── ui/                  # 공통 UI 컴포넌트
│       ├── Button.js, Card.js, Modal.js, Badge.js
│       ├── CurrencyInput.js       # 원화 숫자 입력 (자동 콤마)
│       ├── CompanyLogo.js         # 회사 이니셜 아바타
│       ├── CompanySelect.js, Select.js, Table.js
│       ├── FileUpload.js, TabNav.js, Tutorial.js
│
├── lib/
│   ├── constants.js         # BUDGET_CATEGORIES, TABS, MONTHS, DEFAULT_YEARS
│   ├── mockData.js          # 초기 목 데이터 (API 연동 전 대체 데이터)
│   ├── store.js             # React Context + 모든 상태·CRUD 로직
│   └── utils.js             # formatCurrency, formatPercent, generateId 등`}
        />

        <p className="text-sm font-semibold text-gray-700 mt-4 mb-2">상태 관리 패턴 (lib/store.js)</p>
        <p className="text-xs text-gray-600 leading-relaxed mb-2">
          전역 상태는 <code className="bg-gray-100 px-1 rounded">React Context + useState</code>로 관리합니다.
          현재는 localStorage에 직렬화하여 영속성을 보장하지만, 백엔드 연동 시 API 호출로 교체해야 합니다.
        </p>
        <CodeBlock
          title="핵심 상태 구조 (BudgetProvider)"
          code={`// 현재 모드 자동 분기 — isGeneral 플래그 하나로 모든 컴포넌트가 분기
const isGeneral = data?.project?.siteCategory === 'general';

// 모드에 따라 올바른 데이터 소스를 자동으로 반환
const activeCompanies       = isGeneral ? data.generalCompanies       : data.companies;
const activeBudgetPlans     = isGeneral ? data.generalBudgetPlans     : data.budgetPlans;
const activeExecutionRecords = isGeneral ? data.generalExecutionRecords : data.executionRecords;

// CRUD 함수들은 현재 모드를 내부적으로 판단하여 올바른 필드에 저장
saveCurrentExecutionRecord(record);   // → isGeneral ? generalExecutionRecords : executionRecords
saveCurrentBudgetPlan(plan);
addCurrentCompany(company);`}
        />

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
          <p className="text-xs font-bold text-amber-700 mb-1">⚠️ 백엔드 연동 시 교체 포인트</p>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>• <code className="bg-amber-100 px-1 rounded">loadData()</code> / <code className="bg-amber-100 px-1 rounded">saveData()</code> → API GET/PUT 호출로 교체</li>
            <li>• <code className="bg-amber-100 px-1 rounded">createInitialData()</code> → 서버에서 사용자별 초기 데이터 조회</li>
            <li>• 각 CRUD 함수 내부 → setData + 낙관적 업데이트 + API 호출 패턴으로 교체</li>
            <li>• 인증(auth) 레이어 추가 후 사용자별 데이터 분리 필요</li>
          </ul>
        </div>

        <p className="text-sm font-semibold text-gray-700 mt-4 mb-2">주요 컴포넌트 패턴</p>
        <InfoTable
          headers={['패턴', '설명', '해당 파일']}
          rows={[
            ['모드 분기 렌더링', 'isGeneral로 건설/일반 UI 전환, 컴포넌트 분리 또는 조건부 렌더링', 'BudgetOverview, BudgetPlan, ExecutionRecord'],
            ['원도급 포함 합산', 'includedInPrimary=true인 협력사 집행액을 원도급사 totals에 가산', 'ExecutionRecord, CompanySummary'],
            ['YearSummaryGrid', '전체기간 탭에서 연도별 집행 카드 → 클릭 시 해당 연도로 드릴다운', 'ExecutionRecord'],
            ['모달 중첩', 'DetailEntryModal이 ExecutionEditModal 안에서 열림 (Modal 내 Modal)', 'ExecutionRecord → DetailEntryModal'],
            ['피벗 테이블', '월×항목 or 항목×회사 축으로 데이터 변환 후 렌더링', 'MonthViewModal, ReportPreviewModal'],
          ]}
        />
      </Section>

      {/* 3. 데이터 구조 */}
      <Section icon={Database} title="3. 데이터 구조 (현재 localStorage → 향후 DB 스키마)">
        <p className="text-xs text-gray-500 mb-3">
          현재 모든 데이터는 <code className="bg-gray-100 px-1 rounded">'safety-budget-data'</code> 키 하나에 JSON으로 저장됩니다.
          아래가 전체 데이터 shape입니다.
        </p>
        <CodeBlock
          title="전체 데이터 Shape (lib/mockData.js → createInitialData())"
          code={`{
  project: {
    id, name, contractNo,
    startDate, endDate,
    totalContractAmount,     // 총공사금액 (건설현장용, 원)
    totalRevenue,            // 총 매출액 (일반사업장용, 원)
    siteCategory: 'construction' | 'general',
    siteName,                // 사업장 구분명
    // 안전관리비 계상 계산기 입력값
    siteType, contractDate, calcA, calcB, calcC, calcD, calcE, calcF,
    calculatedSafetyBudget,  // 계산된 안전관리비 계상액 (원)
  },

  // ─── 건설현장 데이터 ───
  companies: [              // 건설현장 원도급·협력사 목록
    {
      id, name, type: 'primary' | 'sub',
      representative, contact, budgetRatio,
      includedInPrimary: boolean,  // 원도급 포함 여부 (집행액 합산 표시)
    }
  ],
  budgetPlans: [            // 건설현장 예산수립
    {
      id, companyId, year,
      period: 'yearly' | 'total',
      items: [
        { categoryId: 'C01'~'C09', amount: 0 }   // 법정 9개 항목
      ]
    }
  ],
  executionRecords: [       // 건설현장 집행실적
    {
      id, companyId, year, month,
      status: 'draft' | 'submitted' | 'approved' | 'rejected',
      createdAt,
      items: [
        {
          categoryId: 'C01'~'C09', amount: 0,
          note,
          details: [        // 건별 상세 입력
            { id, date, vendor, description, amount, paymentMethod, note, orgInfo }
          ],
          evidences: [],    // 항목별 증빙 참조
          orgInfo: null     // 지출품의 정보
        }
      ]
    }
  ],

  // ─── 일반사업장 데이터 (건설현장과 완전 분리) ───
  generalCompanies: [       // 일반사업장 회사 목록 (동일 구조)
    { id, name, type, representative, contact, budgetRatio, includedInPrimary }
  ],
  generalBudgetPlans: [     // 일반사업장 예산수립
    {
      id, companyId, year,
      period: 'yearly',
      items: [
        { id, name: '자유항목명', amount: 0, note }   // 자유 항목
      ]
    }
  ],
  generalExecutionRecords: [ // 일반사업장 집행실적
    {
      id, companyId, year, month, status, createdAt,
      items: [ { id, name: '자유항목명', amount: 0, note } ]
    }
  ],

  // ─── 공통 ───
  companyRegistry: [        // 회사 마스터 목록 (재사용 목적)
    { id, name, bizNo, representative, contact, address, note }
  ],
  evidences: [              // 증빙 파일 목록
    { id, companyId, year, month, categoryId, fileName, fileSize, uploadedAt }
  ],
  monthlyReports: [         // 월별 보고서
    { id, year, month, status, submittedAt, approvedAt, approver, note }
  ],
}`}
        />

        <div className="bg-blue-50 rounded-lg p-3 mt-2">
          <p className="text-xs font-bold text-blue-700 mb-1">💡 DB 설계 권장 사항</p>
          <ul className="text-xs text-blue-700 space-y-1 leading-relaxed">
            <li>• <strong>멀티 사업장</strong>: 현재 단일 프로젝트 → Project 테이블 분리, 사용자별 접근 권한 추가</li>
            <li>• <strong>건설/일반 분리</strong>: siteCategory 컬럼으로 구분하거나 별도 테이블로 분리 (현재 코드는 별도 필드 사용)</li>
            <li>• <strong>BudgetPlanItem</strong>: categoryId(건설) 또는 name(일반) — 하나의 테이블에 type 컬럼으로 통합 가능</li>
            <li>• <strong>ExecutionRecord.items.details</strong>: 별도 PaymentDetail 테이블로 분리 권장 (현재 JSON 내부 배열)</li>
            <li>• <strong>File 저장</strong>: evidence.fileName/fileSize만 저장됨 → 실제 파일은 S3/GCS 등 오브젝트 스토리지 연동 필요</li>
          </ul>
        </div>
      </Section>

      {/* 4. API 설계 제안 */}
      <Section icon={Server} title="4. 백엔드 API 설계 제안" badge="Backend">
        <p className="text-xs text-gray-500 mb-3">
          현재 모든 로직이 프론트 store.js에 있습니다. 아래는 REST API 기준 엔드포인트 설계 예시입니다.
          실제 구현 시 인증 미들웨어(JWT/세션) 필수.
        </p>
        <InfoTable
          headers={['Method', 'Endpoint', '설명', '대응 store.js 함수']}
          rows={[
            ['GET', '/api/projects/:projectId', '프로젝트 + 전체 데이터 조회', 'loadData()'],
            ['PUT', '/api/projects/:projectId', '프로젝트 정보 수정 (siteCategory 포함)', 'updateProject()'],
            ['GET', '/api/projects/:projectId/companies', '회사 목록 조회 (mode 파라미터)', 'activeCompanies'],
            ['POST', '/api/projects/:projectId/companies', '회사 추가', 'addCurrentCompany()'],
            ['PATCH', '/api/companies/:companyId', '회사 수정 (includedInPrimary 포함)', 'updateCurrentCompany()'],
            ['DELETE', '/api/companies/:companyId', '회사 삭제 (연관 데이터 cascade)', 'removeCurrentCompany()'],
            ['GET', '/api/projects/:projectId/budget-plans', '예산수립 목록 (year, period 필터)', 'activeBudgetPlans'],
            ['POST', '/api/projects/:projectId/budget-plans', '예산수립 저장/수정 (upsert)', 'saveCurrentBudgetPlan()'],
            ['GET', '/api/projects/:projectId/execution-records', '집행실적 목록 (year, month, companyId 필터)', 'activeExecutionRecords'],
            ['POST', '/api/projects/:projectId/execution-records', '집행실적 저장/수정 (upsert)', 'saveCurrentExecutionRecord()'],
            ['PATCH', '/api/execution-records/:recordId/status', '보고서 상태 변경 (submitted/approved/rejected)', 'updateReportStatus()'],
            ['GET', '/api/projects/:projectId/evidences', '증빙 목록 조회', 'evidences'],
            ['POST', '/api/projects/:projectId/evidences', '증빙 파일 업로드 (multipart/form-data)', 'addEvidence()'],
            ['DELETE', '/api/evidences/:evidenceId', '증빙 삭제', 'removeEvidence()'],
            ['GET', '/api/company-registry', '회사 마스터 목록', 'data.companyRegistry'],
            ['POST', '/api/company-registry', '마스터 회사 추가', 'addRegistryCompany()'],
          ]}
        />

        <p className="text-sm font-semibold text-gray-700 mt-4 mb-2">집행실적 저장 Body 예시 (건설현장)</p>
        <CodeBlock
          title="POST /api/projects/:projectId/execution-records"
          code={`{
  "companyId": "comp-sub1",
  "year": 2026,
  "month": 3,
  "status": "draft",
  "items": [
    {
      "categoryId": "C01",    // 건설현장: C01~C09
      "amount": 2500000,
      "note": "3월 안전관리자 인건비",
      "details": [
        {
          "date": "2026-03-05",
          "vendor": "(주)안전관리",
          "description": "3월 안전관리자 급여",
          "amount": 2500000,
          "paymentMethod": "계좌이체"
        }
      ]
    },
    { "categoryId": "C02", "amount": 800000, "note": "", "details": [] }
  ]
}

// 일반사업장 items 구조 (categoryId 대신 name 사용)
"items": [
  { "name": "안전교육비", "amount": 500000, "note": "" },
  { "name": "보호구 구입비", "amount": 300000, "note": "" }
]`}
        />

        <div className="bg-gray-50 rounded-lg p-3 mt-2">
          <p className="text-xs font-bold text-gray-700 mb-1">📌 통계 API 필요 시</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            현재 Statistics.js는 프론트에서 전체 데이터를 받아 직접 집계합니다.
            데이터가 커지면 아래 집계 API가 필요합니다:
          </p>
          <ul className="text-xs text-gray-600 space-y-1 mt-1.5">
            <li>• <code className="bg-gray-200 px-1 rounded">GET /api/projects/:id/stats/monthly?year=2026</code> — 월별 집행 합계</li>
            <li>• <code className="bg-gray-200 px-1 rounded">GET /api/projects/:id/stats/yearly</code> — 연도별 예산 대비 집행</li>
            <li>• <code className="bg-gray-200 px-1 rounded">GET /api/projects/:id/stats/category?year=2026</code> — 항목별 집행 비율</li>
          </ul>
        </div>
      </Section>

      {/* 5. 핵심 비즈니스 로직 */}
      <Section icon={Zap} title="5. 핵심 비즈니스 로직">
        <p className="text-sm font-semibold text-gray-700 mb-2">5-1. 안전관리비 계상액 계산 (건설현장)</p>
        <p className="text-xs text-gray-600 mb-2 leading-relaxed">
          산업안전보건법 시행규칙 별표에 따른 공사 종류별 요율로 계산합니다.
          <code className="bg-gray-100 px-1 rounded">SafetyBudgetCalculatorModal.js</code> 참고.
        </p>
        <CodeBlock
          title="계상액 계산 공식"
          code={`// 기본 계산식
// ⓐ 재료비(관급재료비 별도) + ⓑ 관급재료비×1/2 + ⓒ 직접노무비
const baseAmount = calcA + (calcB * 0.5) + calcC;

// 계상액 = 기초액 + (기본 대상액 × 적용요율%)
const calculated = calcF + (baseAmount * calcE / 100);

// 공사 종류별 적용 요율(calcE)과 기초액(calcF)은 법정 테이블 참조
// SafetyBudgetCalculatorModal.js 내 SITE_TYPES 배열에 정의됨

// 예산 편성액과의 차이 표시
const diffFromCalc = grandTotal - calculatedSafetyBudget;
// diffFromCalc >= 0 → 여유 (파란색), < 0 → 초과 (빨간색)`}
        />

        <p className="text-sm font-semibold text-gray-700 mt-4 mb-2">5-2. 원도급 포함 집행 합산</p>
        <CodeBlock
          title="includedInPrimary 처리 (ExecutionRecord.js, CompanySummary.js)"
          code={`// 협력사에 includedInPrimary = true 설정 시
// 해당 협력사의 집행액과 예산액이 원도급사(type='primary') 카드에 합산됨

const includedSubs = activeCompanies.filter((c) => c.includedInPrimary);
const companyStats = baseCompanyStats.map((stat) => {
  if (stat.company.type === 'primary' && includedSubs.length > 0) {
    const extraExecuted = includedSubs.reduce((sum, sub) => {
      const subStat = baseCompanyStats.find((s) => s.company.id === sub.id);
      return sum + (subStat?.executed || 0);
    }, 0);
    // ... 원도급사 stat에 합산
  }
  return stat;
});
// UI: 원도급사 카드에 '+협력사 포함' 뱃지, 협력사 카드에 '원도급 포함' 뱃지 표시`}
        />

        <p className="text-sm font-semibold text-gray-700 mt-4 mb-2">5-3. 집행률 계산</p>
        <CodeBlock
          title="lib/utils.js — calcExecutionRate()"
          code={`// 집행률 = 집행액 / 예산액 × 100
// 예산 0일 때 0 반환 (divide-by-zero 방지)
export const calcExecutionRate = (executed, budget) =>
  budget > 0 ? (executed / budget) * 100 : 0;

// 색상 분기 규칙 (컴포넌트 전체 공통)
// rate > 100% → bg-red-400 (초과)
// rate > 80%  → bg-amber-400 (주의)
// 그 외       → bg-primary (정상)`}
        />

        <p className="text-sm font-semibold text-gray-700 mt-4 mb-2">5-4. 법정 9개 항목 (건설현장 고정 카테고리)</p>
        <InfoTable
          headers={['코드', '항목명', '비고']}
          rows={[
            ['C01', '안전·보건관리자 임금 등', '인건비 및 업무수당'],
            ['C02', '안전시설비 등', '안전난간, 추락방호망 등'],
            ['C03', '보호구 등', '개인보호구 구입비'],
            ['C04', '안전보건진단비 등', '정밀안전진단 등'],
            ['C05', '안전보건교육비 등', '신규·정기·특별교육'],
            ['C06', '근로자 건강장해예방비 등', '건강진단, 작업환경측정'],
            ['C07', '기술지도비', '건설재해예방전문지도기관'],
            ['C08', '본사 전담조직 임금 등', '본사 안전보건 전담조직'],
            ['C09', '위험성평가 소요비용', '2025년~, 한도 20%'],
          ]}
        />
      </Section>

      {/* 6. 구현 시 주의 사항 */}
      <Section icon={AlertCircle} title="6. 구현 시 주의 사항 & TODO" badge="Important" badgeColor="bg-red-500">
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs font-bold text-red-700 mb-2">🔴 필수 처리 항목</p>
            <ul className="text-xs text-red-700 space-y-2 leading-relaxed">
              <li>
                <strong>[인증]</strong> 현재 인증 없음. 다중 사용자 환경에서는 JWT + 역할 기반 접근제어(RBAC) 필수.
                최소 권한: 관리자(모든 CRUD), 조회자(읽기 전용)
              </li>
              <li>
                <strong>[파일 업로드]</strong> 현재 FileUpload 컴포넌트는 파일 메타데이터만 localStorage에 저장.
                실제 파일은 서버에 전송하지 않음. 백엔드 연동 시 multipart/form-data POST 처리 및 S3 업로드 구현 필요.
              </li>
              <li>
                <strong>[프린트 기능]</strong> ReportPreviewModal의 <code className="bg-red-100 px-1 rounded">window.print()</code>는
                전체 페이지 인쇄. 실제 서비스에서는 React-to-PDF 또는 서버사이드 PDF 생성 권장.
              </li>
              <li>
                <strong>[데이터 마이그레이션]</strong> localStorage 스키마 변경 시 기존 데이터 유실 가능.
                store.js useEffect에 마이그레이션 로직 있으나, DB 전환 시 체계적인 마이그레이션 스크립트 필요.
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs font-bold text-amber-700 mb-2">🟡 성능 & UX 개선 권장</p>
            <ul className="text-xs text-amber-700 space-y-2 leading-relaxed">
              <li>
                <strong>[대용량 데이터]</strong> 현재 Statistics.js는 전체 executionRecords를 프론트에서 집계.
                연간 레코드가 수천 건 이상일 경우 서버사이드 집계 API 분리 권장.
              </li>
              <li>
                <strong>[다중 사업장]</strong> 현재 단일 project 객체. 여러 현장을 관리할 경우
                Project 선택 UI + 프로젝트별 데이터 분리 구조 필요.
              </li>
              <li>
                <strong>[실시간 동기화]</strong> 다수 사용자가 동시 편집 시 충돌 처리 미구현.
                낙관적 업데이트 + ETag/버전 관리 또는 WebSocket 실시간 동기화 검토.
              </li>
              <li>
                <strong>[모바일 최적화]</strong> 현재 Tailwind 반응형 적용됨. 하지만 피벗 테이블(MonthViewModal)은
                항목이 많을 경우 모바일에서 가로 스크롤 많아짐. 카드 형태로 대체 레이아웃 고려.
              </li>
            </ul>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-xs font-bold text-emerald-700 mb-2">✅ 현재 잘 구현된 부분 (유지 권장)</p>
            <ul className="text-xs text-emerald-700 space-y-1 leading-relaxed">
              <li>• <strong>듀얼 모드 분기</strong>: isGeneral 플래그 하나로 건설/일반 완전 분리, 코드 중복 최소화</li>
              <li>• <strong>원 단위 통일</strong>: 모든 amount 값은 원(₩) 단위 정수로 저장. 표시 시만 formatCurrency() 사용</li>
              <li>• <strong>컴포넌트 분리</strong>: 공통 UI(Button, Modal, Card 등)가 잘 추상화되어 재사용성 높음</li>
              <li>• <strong>집행률 색상 규칙</strong>: 전체 앱에서 100% 초과(빨강), 80% 초과(주황), 정상(초록) 일관 적용</li>
              <li>• <strong>모달 중첩 패턴</strong>: 집행실적 편집 → 상세 입력 모달 흐름이 자연스럽게 구현됨</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* 7. 기술 스택 */}
      <Section icon={Code2} title="7. 기술 스택 & 참고 라이브러리">
        <InfoTable
          headers={['분류', '기술', '버전', '용도']}
          rows={[
            ['프레임워크', 'Next.js', '14.x (App Router)', '페이지 라우팅, SSR/SSG, 빌드'],
            ['UI', 'React', '18.x', '컴포넌트, hooks, Context API'],
            ['스타일', 'Tailwind CSS', '3.x', '유틸리티 클래스 기반 스타일링'],
            ['차트', 'Recharts', '2.x', '막대/라인/파이/영역 차트 (Statistics.js)'],
            ['아이콘', 'lucide-react', '최신', '전체 아이콘 세트'],
            ['상태관리', 'React Context', '내장', '전역 상태 (store.js)'],
            ['영속성', 'localStorage', '현재 프로토타입', '→ REST API + DB로 교체 필요'],
            ['폰트', 'Noto Sans KR', 'Google Fonts', '한국어 최적화'],
          ]}
        />

        <p className="text-sm font-semibold text-gray-700 mt-4 mb-2">백엔드 스택 추천 (참고)</p>
        <InfoTable
          headers={['분류', '권장 기술', '이유']}
          rows={[
            ['API 서버', 'Next.js API Routes 또는 Node.js (Express/Fastify)', '프론트와 동일 레포 또는 분리 모노레포 구성 가능'],
            ['DB', 'PostgreSQL + Prisma ORM', '관계형 데이터 구조에 적합, 타입 안전성'],
            ['인증', 'NextAuth.js 또는 Supabase Auth', '소규모면 Supabase로 빠르게 구현 가능'],
            ['파일 저장', 'AWS S3 / Cloudflare R2', '증빙 파일 저장, presigned URL로 클라이언트 직접 업로드'],
            ['배포', 'Vercel (프론트) + Railway/Render (백엔드)', '현재 Vercel 배포 유지, 백엔드만 분리'],
          ]}
        />
      </Section>

      {/* 8. 환경 변수 */}
      <Section icon={GitBranch} title="8. 환경 변수 및 배포">
        <p className="text-xs text-gray-500 mb-2">백엔드 연동 시 추가해야 할 환경 변수 목록 (.env.local)</p>
        <CodeBlock
          title=".env.local (예시)"
          code={`# API
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# 인증 (NextAuth.js 사용 시)
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key

# DB (Prisma 사용 시)
DATABASE_URL=postgresql://user:password@host:5432/safety_budget

# 파일 스토리지 (AWS S3)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=safety-budget-files

# Vercel 배포 시 Vercel 대시보드에서 Environment Variables 설정`}
        />
        <div className="bg-gray-50 rounded-lg p-3 mt-3">
          <p className="text-xs font-bold text-gray-700 mb-1">📦 현재 배포 구조</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• <strong>GitHub:</strong> https://github.com/SEONGJUP/Safetybudget (main 브랜치)</li>
            <li>• <strong>Vercel:</strong> https://safety-budget.vercel.app (수동 배포: <code className="bg-gray-200 px-1 rounded">vercel --prod</code>)</li>
            <li>• <strong>자동 배포 미설정</strong>: Vercel 대시보드 → Git Integration에서 GitHub 연동 시 push 자동 배포 가능</li>
          </ul>
        </div>
      </Section>

      {/* 하단 */}
      <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
        <CheckCircle2 size={13} className="text-emerald-500" />
        최종 업데이트: 2026-04-02 · 이 가이드는 DevGuide.js 컴포넌트에서 직접 관리합니다.
      </div>
    </div>
  );
}
