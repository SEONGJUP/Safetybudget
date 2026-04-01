'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createInitialData } from './mockData';
import { generateId } from './utils';

const BudgetContext = createContext(null);

const STORAGE_KEY = 'safety-budget-data';

function loadData() {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function saveData(data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function BudgetProvider({ children }) {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState('yearly'); // 'total' | 'yearly'
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');

  // 초기 데이터 로드
  useEffect(() => {
    const saved = loadData();
    if (saved) {
      // 마이그레이션: companyRegistry 누락 시 초기 데이터로 보완
      const initial = createInitialData();
      if (!saved.companyRegistry || saved.companyRegistry.length === 0) {
        saved.companyRegistry = initial.companyRegistry;
      }
      // 마이그레이션: generalCompanies 누락 시 보완
      if (!saved.generalCompanies) {
        saved.generalCompanies = initial.generalCompanies;
        saved.generalBudgetPlans = initial.generalBudgetPlans;
        saved.generalExecutionRecords = initial.generalExecutionRecords;
      }
      setData(saved);
    } else {
      setData(createInitialData());
    }
  }, []);

  // 데이터 변경 시 저장
  useEffect(() => {
    if (data) saveData(data);
  }, [data]);

  // 회사 추가
  const addCompany = useCallback((company) => {
    setData((prev) => ({
      ...prev,
      companies: [...prev.companies, { ...company, id: generateId(), type: 'sub' }],
    }));
  }, []);

  // 회사 수정
  const updateCompany = useCallback((id, updates) => {
    setData((prev) => ({
      ...prev,
      companies: prev.companies.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  // 회사 삭제
  const removeCompany = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      companies: prev.companies.filter((c) => c.id !== id),
      budgetPlans: prev.budgetPlans.filter((bp) => bp.companyId !== id),
      executionRecords: prev.executionRecords.filter((er) => er.companyId !== id),
      evidences: prev.evidences.filter((ev) => ev.companyId !== id),
    }));
  }, []);

  // 예산수립 저장/수정
  const saveBudgetPlan = useCallback((plan) => {
    setData((prev) => {
      const exists = prev.budgetPlans.find((bp) => bp.id === plan.id);
      if (exists) {
        return { ...prev, budgetPlans: prev.budgetPlans.map((bp) => (bp.id === plan.id ? plan : bp)) };
      }
      return { ...prev, budgetPlans: [...prev.budgetPlans, { ...plan, id: generateId() }] };
    });
  }, []);

  // 집행실적 저장/수정
  const saveExecutionRecord = useCallback((record) => {
    setData((prev) => {
      const exists = prev.executionRecords.find((er) => er.id === record.id);
      if (exists) {
        return { ...prev, executionRecords: prev.executionRecords.map((er) => (er.id === record.id ? record : er)) };
      }
      return { ...prev, executionRecords: [...prev.executionRecords, { ...record, id: generateId() }] };
    });
  }, []);

  // 월별보고서 상태 변경
  const updateReportStatus = useCallback((reportId, status, extra = {}) => {
    setData((prev) => ({
      ...prev,
      monthlyReports: prev.monthlyReports.map((r) =>
        r.id === reportId ? { ...r, status, ...extra } : r
      ),
    }));
  }, []);

  // 보고서 추가
  const addReport = useCallback((report) => {
    setData((prev) => ({
      ...prev,
      monthlyReports: [...prev.monthlyReports, { ...report, id: generateId() }],
    }));
  }, []);

  // 증빙 추가
  const addEvidence = useCallback((evidence) => {
    setData((prev) => ({
      ...prev,
      evidences: [...prev.evidences, { ...evidence, id: generateId() }],
    }));
  }, []);

  // 증빙 삭제
  const removeEvidence = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      evidences: prev.evidences.filter((ev) => ev.id !== id),
    }));
  }, []);

  // 회사 마스터 목록 추가
  const addRegistryCompany = useCallback((company) => {
    setData((prev) => ({
      ...prev,
      companyRegistry: [...(prev.companyRegistry || []), { ...company, id: generateId() }],
    }));
  }, []);

  // 회사 마스터 목록 수정
  const updateRegistryCompany = useCallback((id, updates) => {
    setData((prev) => ({
      ...prev,
      companyRegistry: (prev.companyRegistry || []).map((c) => c.id === id ? { ...c, ...updates } : c),
    }));
  }, []);

  // 회사 마스터 목록 삭제
  const removeRegistryCompany = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      companyRegistry: (prev.companyRegistry || []).filter((c) => c.id !== id),
    }));
  }, []);

  // 프로젝트 정보 업데이트
  const updateProject = useCallback((updates) => {
    setData((prev) => ({
      ...prev,
      project: { ...prev.project, ...updates },
    }));
  }, []);

  // ─── 현재 모드에 따른 CRUD (자동 라우팅) ───

  const addCurrentCompany = useCallback((company) => {
    setData((prev) => {
      const isGen = prev.project?.siteCategory === 'general';
      const field = isGen ? 'generalCompanies' : 'companies';
      return { ...prev, [field]: [...(prev[field] || []), { ...company, id: generateId(), type: 'sub' }] };
    });
  }, []);

  const updateCurrentCompany = useCallback((id, updates) => {
    setData((prev) => {
      const isGen = prev.project?.siteCategory === 'general';
      const field = isGen ? 'generalCompanies' : 'companies';
      return { ...prev, [field]: (prev[field] || []).map((c) => c.id === id ? { ...c, ...updates } : c) };
    });
  }, []);

  const removeCurrentCompany = useCallback((id) => {
    setData((prev) => {
      const isGen = prev.project?.siteCategory === 'general';
      const compField = isGen ? 'generalCompanies' : 'companies';
      const planField = isGen ? 'generalBudgetPlans' : 'budgetPlans';
      const execField = isGen ? 'generalExecutionRecords' : 'executionRecords';
      return {
        ...prev,
        [compField]: (prev[compField] || []).filter((c) => c.id !== id),
        [planField]: (prev[planField] || []).filter((bp) => bp.companyId !== id),
        [execField]: (prev[execField] || []).filter((er) => er.companyId !== id),
      };
    });
  }, []);

  const saveCurrentExecutionRecord = useCallback((record) => {
    setData((prev) => {
      const isGen = prev.project?.siteCategory === 'general';
      const field = isGen ? 'generalExecutionRecords' : 'executionRecords';
      const list = prev[field] || [];
      const exists = list.find((er) => er.id === record.id);
      return {
        ...prev,
        [field]: exists
          ? list.map((er) => er.id === record.id ? record : er)
          : [...list, { ...record, id: record.id || generateId() }],
      };
    });
  }, []);

  const saveCurrentBudgetPlan = useCallback((plan) => {
    setData((prev) => {
      const isGen = prev.project?.siteCategory === 'general';
      const field = isGen ? 'generalBudgetPlans' : 'budgetPlans';
      const list = prev[field] || [];
      const exists = list.find((bp) => bp.id === plan.id);
      return {
        ...prev,
        [field]: exists
          ? list.map((bp) => bp.id === plan.id ? plan : bp)
          : [...list, { ...plan, id: plan.id || generateId() }],
      };
    });
  }, []);

  // 데이터 초기화
  const resetData = useCallback(() => {
    const fresh = createInitialData();
    setData(fresh);
  }, []);

  // 집행실적 합계 (회사별, 년도별)
  const getExecutionTotal = useCallback(
    (companyId, year) => {
      if (!data) return 0;
      return data.executionRecords
        .filter((er) => er.companyId === companyId && er.year === year)
        .reduce((sum, er) => {
          const recTotal = er.items.reduce((s, item) => s + (Number(item.amount) || 0), 0);
          return sum + recTotal;
        }, 0);
    },
    [data]
  );

  // 전체 집행합계
  const getTotalExecution = useCallback(
    (companyId) => {
      if (!data) return 0;
      const filter = companyId && companyId !== 'all'
        ? data.executionRecords.filter((er) => er.companyId === companyId)
        : data.executionRecords;
      return filter.reduce((sum, er) => {
        const recTotal = er.items.reduce((s, item) => s + (Number(item.amount) || 0), 0);
        return sum + recTotal;
      }, 0);
    },
    [data]
  );

  // ─── 모드에 따른 computed 값 ───
  const isGeneral = data?.project?.siteCategory === 'general';
  const activeCompanies = isGeneral
    ? (data?.generalCompanies || [])
    : (data?.companies || []);
  const activeBudgetPlans = isGeneral
    ? (data?.generalBudgetPlans || [])
    : (data?.budgetPlans || []);
  const activeExecutionRecords = isGeneral
    ? (data?.generalExecutionRecords || [])
    : (data?.executionRecords || []);

  const value = {
    data,
    isGeneral,
    activeCompanies,
    activeBudgetPlans,
    activeExecutionRecords,
    activeTab,
    setActiveTab,
    selectedYear,
    setSelectedYear,
    selectedPeriod,
    setSelectedPeriod,
    selectedCompanyId,
    setSelectedCompanyId,
    addCompany,
    updateCompany,
    removeCompany,
    saveBudgetPlan,
    saveExecutionRecord,
    updateReportStatus,
    addReport,
    addEvidence,
    removeEvidence,
    addCurrentCompany,
    updateCurrentCompany,
    removeCurrentCompany,
    saveCurrentBudgetPlan,
    saveCurrentExecutionRecord,
    addRegistryCompany,
    updateRegistryCompany,
    removeRegistryCompany,
    updateProject,
    resetData,
    getExecutionTotal,
    getTotalExecution,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}
