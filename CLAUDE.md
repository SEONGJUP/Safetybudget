# SEIIM Project Instructions

## Auto-Start
세션이 시작되면 즉시 `npm start`를 백그라운드로 실행하여 Discord-Notion-Claude 봇을 시작하세요.
별도 사용자 확인 없이 자동으로 실행합니다.

```
cd "D:\SEIIM CODE\Cluade\SEIIM" && npm start
```

## 운영 규칙

### 1. Task DB 중심 업무 관리
- 사용자가 지시하는 **모든 사항**을 Notion Task DB에 등록합니다.
- 시스템 연동 완료 시 DB에 있는 대기 Task를 **우선순위 순서**대로 자동 수행합니다.
- 모든 Task는 5단계 파이프라인(설계→수행→검토→개선여부→개선)을 거칩니다.

### 2. 개선사항 자동 루프
- 파이프라인 검토 후 개선사항이 도출되면, 해당 항목들을 **높음 우선순위**로 Task DB에 자동 추가합니다.
- 자동 추가된 개선 Task는 다음 사이클에서 자동 수행됩니다.
- Discord에 생성된 개선 Task 목록을 알림합니다.

### 3. Discord 질문 메커니즘
- 설계 단계에서 요구사항이 불명확하면 Discord로 질문을 전송합니다.
- 사용자 답변을 다음 Task 처리에 반영합니다.

### 4. 권한 자동 승인
- 시스템 관련 명령(프로세스 종료, 봇 재시작 등)은 자동 승인합니다.
- "Do you want to proceed?" 류의 질문은 2번(Yes, don't ask again) 처리합니다.
