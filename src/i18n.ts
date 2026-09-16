import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

const resources = {
  ko: {
    translation: {
      language: { label: "언어", korean: "한국어", english: "English" },
      common: { retry: "다시 시도", save: "저장", cancel: "취소", empty: "항목 없음" },
      activity: {
        collapseSidebar: "사이드바 접기", expandSidebar: "사이드바 펼치기",
        notes: "Note 목록", search: "Note 검색", dailyNote: "오늘의 Daily Note",
        drawResults: "추첨 결과", assistant: "Workspace Assistant",
        lightMode: "라이트 모드", darkMode: "다크 모드",
      },
      landing: {
        headline: "생각나는 대로 적고,", headlineAccent: "편하게 정리하세요",
        description1: "문서, 일정, 칸반 보드를 하나의 공간에서.",
        description2: "가볍고 빠른 워크스페이스를 경험해 보세요.",
        google: "Google로 시작하기", kakao: "카카오로 시작하기", devLoginFailed: "Dev 로그인에 실패했습니다",
        devUser: "Dev 유저 {{id}}", footer: "지금 바로 시작하세요 — 무료로 이용할 수 있습니다.",
        features: {
          documents: { title: "계층형 문서 관리", description: "Task와 Note를 원하는 깊이로 자유롭게 연결해 생각을 체계적으로 정리하세요." },
          kanban: { title: "칸반 보드", description: "할 일, 진행 중, 완료 상태로 업무 현황을 한눈에 파악하세요." },
          calendar: { title: "캘린더 & 데일리 노트", description: "일정 기반으로 작업을 관리하고, 매일의 기록을 남기세요." },
          search: { title: "전체 검색", description: "모든 문서를 빠르게 검색해 필요한 정보를 즉시 찾으세요." },
        },
      },
      kanban: {
        title: "Kanban", selectSpace: "Space 선택", selectSpacePrompt: "Space를 선택하세요",
        loadFailed: "칸반 데이터를 불러오지 못했습니다", statuses: { notStarted: "할 일", inProgress: "진행 중", completed: "완료" },
      },
      calendar: {
        today: "오늘", monthTitle: "{{year}}년 {{month}}월", weekdays: ["일", "월", "화", "수", "목", "금", "토"],
        start: "시작 {{count}}", end: "마감 {{count}}", loadFailed: "일정을 불러오지 못했습니다",
      },
      chat: {
        subtitle: "인덱싱된 문서를 기준으로 답변합니다", close: "챗봇 닫기", promptTitle: "문서에 관해 질문해 보세요",
        promptDescription: "참여 중인 워크스페이스와 Daily Note에서 관련 내용을 찾아 출처와 함께 답변합니다.",
        sending: "문서를 검색하고 답변을 작성하는 중...", placeholder: "워크스페이스 문서에 질문하기",
        keyboardHint: "Enter 전송 · Shift+Enter 줄바꿈", send: "질문 전송", failed: "답변을 가져오지 못했습니다.", sources: "출처",
      },
      profile: {
        title: "프로필", imageAlt: "프로필", uploadFailed: "이미지 업로드에 실패했습니다", uploading: "업로드 중 {{progress}}%",
        updated: "프로필이 수정되었습니다", saveFailed: "프로필 저장에 실패했습니다", checkInput: "프로필 정보를 다시 확인해 주세요",
        logout: "로그아웃", name: "이름", memberTag: "식별 태그", payoutAccount: "송금 계좌",
        deletePayout: "송금 계좌 삭제", confirmDeletePayout: "등록된 송금 계좌를 삭제할까요?", payoutDeleted: "송금 계좌가 삭제되었습니다",
        payoutDeleteFailed: "송금 계좌 삭제에 실패했습니다", nickname: "닉네임", nicknamePlaceholder: "닉네임을 입력하세요",
        dayStart: "하루 시작 시간", selectHour: "시 선택", selectMinute: "분 선택", hour: "{{value}}시", minute: "{{value}}분",
        invalidDayStart: "하루 시작 시간을 다시 선택해 주세요.", nicknameRequired: "닉네임을 입력해 주세요",
        nicknameMax: "닉네임은 20자 이하여야 합니다", nicknameHash: "닉네임에는 #을 사용할 수 없습니다",
      },
      sidebar: {
        close: "사이드바 닫기", searchPlaceholder: "내 Note 검색...", searchPrompt: "검색어를 입력하세요", searching: "검색 중...",
        noResults: "검색 결과가 없습니다", loadingDocuments: "문서 불러오는 중...", loadFailed: "문서를 불러오지 못했습니다", selectWorkspace: "Workspace 선택",
        addWorkspace: "Work Space 추가", createWorkspace: "Workspace 생성하기", inviteMember: "멤버 초대", addRoot: "최상위 Note 추가",
        newNote: "새 Note", newTask: "새 Task", emptyTitle: "아직 Note가 없어요", emptyDescription: "첫 Note를 만들고 바로 글을 작성해 보세요.", firstNote: "첫 Note 만들기",
      },
    },
  },
  en: {
    translation: {
      language: { label: "Language", korean: "한국어", english: "English" },
      common: { retry: "Try again", save: "Save", cancel: "Cancel", empty: "No items" },
      activity: {
        collapseSidebar: "Collapse sidebar", expandSidebar: "Expand sidebar",
        notes: "Notes", search: "Search notes", dailyNote: "Today's daily note",
        drawResults: "Draw results", assistant: "Workspace Assistant",
        lightMode: "Light mode", darkMode: "Dark mode",
      },
      landing: {
        headline: "Write down your thoughts,", headlineAccent: "organize them with ease",
        description1: "Documents, schedules, and Kanban boards in one place.",
        description2: "Experience a lightweight, fast workspace.",
        google: "Continue with Google", kakao: "Continue with Kakao", devLoginFailed: "Developer login failed",
        devUser: "Dev user {{id}}", footer: "Get started now — free to use.",
        features: {
          documents: { title: "Hierarchical documents", description: "Connect Tasks and Notes at any depth to organize your ideas." },
          kanban: { title: "Kanban board", description: "See what is pending, in progress, and completed at a glance." },
          calendar: { title: "Calendar & daily notes", description: "Manage schedule-based work and keep a record of each day." },
          search: { title: "Global search", description: "Quickly search every document and find what you need." },
        },
      },
      kanban: {
        title: "Kanban", selectSpace: "Select a space", selectSpacePrompt: "Select a space to view its board",
        loadFailed: "Could not load the Kanban board", statuses: { notStarted: "To do", inProgress: "In progress", completed: "Completed" },
      },
      calendar: {
        today: "Today", monthTitle: "{{month}} {{year}}", weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        start: "Starts {{count}}", end: "Due {{count}}", loadFailed: "Could not load the calendar",
      },
      chat: {
        subtitle: "Answers are based on indexed documents", close: "Close assistant", promptTitle: "Ask about your documents",
        promptDescription: "Find answers and sources from your workspaces and Daily Notes.",
        sending: "Searching documents and preparing an answer...", placeholder: "Ask about workspace documents",
        keyboardHint: "Enter to send · Shift+Enter for a new line", send: "Send question", failed: "Could not get an answer.", sources: "Sources",
      },
      profile: {
        title: "Profile", imageAlt: "Profile", uploadFailed: "Image upload failed", uploading: "Uploading {{progress}}%",
        updated: "Profile updated", saveFailed: "Could not save profile", checkInput: "Please check your profile information",
        logout: "Log out", name: "Name", memberTag: "Member tag", payoutAccount: "Payout account",
        deletePayout: "Delete payout account", confirmDeletePayout: "Delete the registered payout account?", payoutDeleted: "Payout account deleted",
        payoutDeleteFailed: "Could not delete payout account", nickname: "Nickname", nicknamePlaceholder: "Enter a nickname",
        dayStart: "Day starts at", selectHour: "Select hour", selectMinute: "Select minute", hour: "{{value}} hr", minute: "{{value}} min",
        invalidDayStart: "Please select the day start time again.", nicknameRequired: "Please enter a nickname",
        nicknameMax: "Nickname must be 20 characters or fewer", nicknameHash: "Nickname cannot contain #",
      },
      sidebar: {
        close: "Close sidebar", searchPlaceholder: "Search my notes...", searchPrompt: "Enter a search term", searching: "Searching...",
        noResults: "No results", loadingDocuments: "Loading documents...", loadFailed: "Could not load documents", selectWorkspace: "Select a workspace",
        addWorkspace: "Add workspace", createWorkspace: "Create a workspace", inviteMember: "Invite members", addRoot: "Add a top-level note",
        newNote: "New Note", newTask: "New Task", emptyTitle: "No notes yet", emptyDescription: "Create your first note and start writing.", firstNote: "Create first note",
      },
    },
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ["ko", "en"],
    nonExplicitSupportedLngs: true,
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "note-vault-language",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

function syncDocumentLanguage(language: string) {
  const resolved = language.startsWith("ko") ? "ko" : "en";
  document.documentElement.lang = resolved;
  document.title = resolved === "ko"
    ? "Note Vault - 나만의 업무 관리 서비스"
    : "Note Vault - Your workspace for notes and tasks";
}

syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);
i18n.on("languageChanged", syncDocumentLanguage);

export default i18n;
