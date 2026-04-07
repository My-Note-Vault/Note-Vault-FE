import { useState, useCallback, useRef, useEffect, Component, type ReactNode, type ErrorInfo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import ActivityBar from "./components/ActivityBar";
import Sidebar from "./components/Sidebar";
import type { SidebarItem, DocType } from "@/types/common";
import TabPane, { type PaneId, type PaneState } from "./components/TabPane";
import {
    useDocumentTree,
    useDailyNotes,
} from "@/hooks/useDocuments";
import {
    useCreateEntity,
    useDeleteEntity,
    useUpdateEntity,
} from "@/hooks/useEntity";
import { useLastVisited, useUpdateLastVisited } from "@/hooks/useLastVisited";
import PublicRoute from "./components/auth/PublicRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProfileSetupRoute from "./components/auth/ProfileSetupRoute";
import LandingPage from "./page/LandingPage";
import OAuthCallbackPage from "./page/OAuthCallbackPage";
import ProfileSetupPage from "./page/ProfileSetupPage";
import { AlertTriangle, RefreshCw } from "lucide-react";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            onError: (error) => {
                const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다";
                toast.error(message);
            },
        },
    },
});

// --- Error Boundary ---
interface ErrorBoundaryProps {
    children: ReactNode;
}
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("[ErrorBoundary]", error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen items-center justify-center bg-background">
                    <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                        <h2 className="text-lg font-semibold">오류가 발생했습니다</h2>
                        <p className="text-sm text-muted-foreground">
                            {this.state.error?.message ?? "예기치 않은 오류입니다"}
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm hover:bg-muted transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            다시 시도
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

function findDocById(docs: SidebarItem[], id: string): SidebarItem | null {
    for (const doc of docs) {
        if (doc.id === id) return doc;
        if (doc.children) {
            const found = findDocById(doc.children, id);
            if (found) return found;
        }
    }
    return null;
}

function collectAllIds(doc: SidebarItem): string[] {
    const ids = [doc.id];
    if (doc.children) {
        for (const child of doc.children) {
            ids.push(...collectAllIds(child));
        }
    }
    return ids;
}

const CHILD_TYPE_MAP: Record<DocType, DocType | null> = {
    space: "task",
    task: "subtask",
    subtask: "trivia",
    trivia: null,
};

const TYPE_LABELS: Record<DocType, string> = {
    space: "새 Work Space",
    task: "새 Task",
    subtask: "새 Sub Task",
    trivia: "새 Trivia",
};

interface SplitState {
    mode: "single" | "split";
    focusedPane: PaneId;
    panes: Record<PaneId, PaneState>;
}

function AppContent() {
    const { data: docs = [], unfoldedIds, isLoading } = useDocumentTree();
    const { data: dailyNotes } = useDailyNotes();
    const createEntityMutation = useCreateEntity();
    const deleteEntityMutation = useDeleteEntity();
    const updateEntityMutation = useUpdateEntity();
    const [searchParams, setSearchParams] = useSearchParams();

    // Last visited
    const { data: lastVisited, isSuccess: lastVisitedLoaded } = useLastVisited();
    const updateLastVisitedMutation = useUpdateLastVisited();
    const hasRestoredLastVisited = useRef(false);

    const [sidebarOpen, setSidebarOpen] = useState(true);

    // localStorage에서 초기 상태 복원
    const [splitState, setSplitState] = useState<SplitState>(() => {
        try {
            const saved = localStorage.getItem("splitState");
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed;
            }
        } catch (e) {
            console.error("Failed to restore splitState:", e);
        }
        return {
            mode: "single",
            focusedPane: "left",
            panes: {
                left: { tabs: [], activeTabId: null },
                right: { tabs: [], activeTabId: null },
            },
        };
    });
    const [draggingTabId, setDraggingTabId] = useState<string | null>(null);

    // 최신 state 참조 (useCallback 안에서 사용)
    const splitStateRef = useRef(splitState);
    splitStateRef.current = splitState;

    const docsRef = useRef(docs);
    docsRef.current = docs;

    const dailyNotesRef = useRef(dailyNotes);
    dailyNotesRef.current = dailyNotes;

    // splitState가 변경될 때마다 localStorage에 저장
    useEffect(() => {
        try {
            localStorage.setItem("splitState", JSON.stringify(splitState));
        } catch (e) {
            console.error("Failed to save splitState:", e);
        }
    }, [splitState]);

    // 활성 탭이 변경되면 URL 업데이트
    useEffect(() => {
        const activePane = splitState.panes[splitState.focusedPane];
        const activeTabId = activePane.activeTabId;
        if (activeTabId) {
            setSearchParams({ tab: activeTabId }, { replace: true });
        } else {
            setSearchParams({}, { replace: true });
        }
    }, [splitState.focusedPane, splitState.panes, setSearchParams]);

    // URL에서 탭 복원 (마운트 시 한 번)
    const hasRestoredFromUrl = useRef(false);
    useEffect(() => {
        if (hasRestoredFromUrl.current) return;
        const tabId = searchParams.get("tab");
        if (tabId) {
            hasRestoredFromUrl.current = true;
            handleSelectDocument(tabId);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 생성 성공 시 탭 열기 헬퍼
    const openNewTab = useCallback((id: string, name: string, docType: DocType) => {
        setSplitState((prev) => {
            const targetPaneId = prev.focusedPane;
            const pane = prev.panes[targetPaneId];
            if (pane.tabs.length >= 4) return prev;

            return {
                ...prev,
                panes: {
                    ...prev.panes,
                    [targetPaneId]: {
                        tabs: [
                            { id, name, isDaily: false, docType, children: [], isNew: true },
                            ...pane.tabs,
                        ].slice(0, 4),
                        activeTabId: id,
                    },
                },
            };
        });
    }, []);

    // 마운트 시 최근 방문 문서 또는 Daily Note 복원
    useEffect(() => {
        if (!hasRestoredLastVisited.current && lastVisitedLoaded && !hasRestoredFromUrl.current) {
            hasRestoredLastVisited.current = true;
            if (lastVisited) {
                handleSelectDocument(lastVisited.documentId);
            } else {
                // 새 사용자: Daily Note 자동 열기
                handleSelectDocument("daily-note");
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastVisited, lastVisitedLoaded]);

    // 세션 종료 시 마지막 방문 문서 서버 전송
    useEffect(() => {
        const handleBeforeUnload = () => {
            const raw = localStorage.getItem("last_visited");
            if (!raw) return;
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            fetch("/api/v1/members/last-visited-path", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: raw,
                keepalive: true,
            });
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    const handleSelectDocument = useCallback((id: string) => {
        const isCalendar = id === "calendar-view";
        const isKanban = id === "kanban-view";
        const isDaily = id === "daily-note"
            || !!dailyNotesRef.current?.children?.some(c => c.id === id);

        let name: string;
        let docType: DocType | undefined;
        let children: { id: string; name: string }[] = [];

        if (isCalendar) {
            name = "Calendar";
        } else if (isKanban) {
            name = "Kanban";
        } else {
            const allDocs = dailyNotesRef.current
                ? [dailyNotesRef.current, ...docsRef.current]
                : docsRef.current;
            const doc = findDocById(allDocs, id);
            name = doc?.name ?? id;
            docType = doc?.type;
            children = doc?.children
                ?.filter((c) => !c.children || c.type)
                ?.map((c) => ({ id: c.id, name: c.name })) ?? [];
        }

        setSplitState((prev) => {
            for (const pid of ["left", "right"] as PaneId[]) {
                const p = prev.panes[pid];
                if (p.tabs.some((t) => t.id === id)) {
                    return {
                        ...prev,
                        focusedPane: pid,
                        panes: {
                            ...prev.panes,
                            [pid]: { ...p, activeTabId: id },
                        },
                    };
                }
            }

            const targetPaneId = prev.focusedPane;
            const pane = prev.panes[targetPaneId];

            if (pane.tabs.length >= 4) return prev;

            return {
                ...prev,
                panes: {
                    ...prev.panes,
                    [targetPaneId]: {
                        tabs: [{ id, name, isDaily: isDaily || isCalendar, docType, children }, ...pane.tabs].slice(0, 4),
                        activeTabId: id,
                    },
                },
            };
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAddItem = useCallback((parentId: string) => {
        const parent = findDocById(docsRef.current, parentId);
        if (!parent?.type) return;
        const childType = CHILD_TYPE_MAP[parent.type];
        if (!childType) return;

        createEntityMutation.mutate(
            { type: childType, name: TYPE_LABELS[childType], parentId },
            { onSuccess: (result) => openNewTab(result.id, result.name, childType) },
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAddSpace = useCallback(() => {
        createEntityMutation.mutate(
            { type: "space" as DocType, name: TYPE_LABELS["space"] },
            { onSuccess: (result) => openNewTab(result.id, result.name, "space" as DocType) },
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleClickTab = useCallback((paneId: PaneId, tabId: string) => {
        setSplitState((prev) => ({
            ...prev,
            focusedPane: paneId,
            panes: {
                ...prev.panes,
                [paneId]: { ...prev.panes[paneId], activeTabId: tabId },
            },
        }));
    }, []);

    const handleCloseTab = useCallback((paneId: PaneId, tabId: string) => {
        setSplitState((prev) => {
            const pane = prev.panes[paneId];
            const newTabs = pane.tabs.filter((t) => t.id !== tabId);
            const newActiveTabId =
                pane.activeTabId === tabId
                    ? (newTabs[0]?.id ?? null)
                    : pane.activeTabId;

            const otherPaneId: PaneId = paneId === "left" ? "right" : "left";

            if (newTabs.length === 0 && prev.mode === "split") {
                return {
                    mode: "single",
                    focusedPane: "left",
                    panes: {
                        left: prev.panes[otherPaneId],
                        right: { tabs: [], activeTabId: null },
                    },
                };
            }

            return {
                ...prev,
                panes: {
                    ...prev.panes,
                    [paneId]: { tabs: newTabs, activeTabId: newActiveTabId },
                },
            };
        });
    }, []);

    const handleDropTab = useCallback((tabId: string, sourcePane: PaneId, targetPane: PaneId) => {
        setSplitState((prev) => {
            if (sourcePane === targetPane && prev.mode === "split") return prev;
            if (prev.mode === "single" && sourcePane === "left" && targetPane === "left") return prev;

            const sourceTab = prev.panes[sourcePane].tabs.find((t) => t.id === tabId);
            if (!sourceTab) return prev;

            if (prev.mode === "single" && prev.panes[sourcePane].tabs.length <= 1) return prev;
            if (prev.mode === "split" && prev.panes[targetPane].tabs.length >= 4) return prev;

            const newSourceTabs = prev.panes[sourcePane].tabs.filter((t) => t.id !== tabId);
            const newSourceActive =
                prev.panes[sourcePane].activeTabId === tabId
                    ? (newSourceTabs[0]?.id ?? null)
                    : prev.panes[sourcePane].activeTabId;

            const alreadyInTarget = prev.panes[targetPane].tabs.some((t) => t.id === tabId);
            const newTargetTabs = alreadyInTarget
                ? prev.panes[targetPane].tabs
                : [sourceTab, ...prev.panes[targetPane].tabs].slice(0, 4);

            const sourceEmpty = newSourceTabs.length === 0;
            let newMode = prev.mode;

            if (prev.mode === "single" && targetPane !== sourcePane) {
                newMode = "split";
            }
            if (sourceEmpty && prev.mode === "split") {
                newMode = "single";
            }

            const newPanes = {
                ...prev.panes,
                [sourcePane]: { tabs: newSourceTabs, activeTabId: newSourceActive },
                [targetPane]: { tabs: newTargetTabs, activeTabId: tabId },
            };

            if (newMode === "single" && sourceEmpty) {
                return {
                    mode: "single" as const,
                    focusedPane: "left" as PaneId,
                    panes: {
                        left: newPanes[targetPane],
                        right: { tabs: [], activeTabId: null },
                    },
                };
            }

            return {
                mode: newMode,
                focusedPane: targetPane,
                panes: newPanes,
            };
        });
    }, []);

    const handleDeleteDocument = useCallback((id: string) => {
        // 삭제 대상과 하위 ID 수집
        const doc = findDocById(docsRef.current, id);
        const idsToRemove = doc ? new Set(collectAllIds(doc)) : new Set([id]);
        const docType = doc?.type;

        // 열린 탭에서 제거 (즉시 UI 반응)
        setSplitState((prev) => {
            const newPanes = Object.fromEntries(
                (["left", "right"] as PaneId[]).map((pid) => {
                    const pane = prev.panes[pid];
                    const newTabs = pane.tabs.filter((t) => !idsToRemove.has(t.id));
                    const newActiveTabId = pane.activeTabId && idsToRemove.has(pane.activeTabId)
                        ? (newTabs[0]?.id ?? null)
                        : pane.activeTabId;
                    return [pid, { tabs: newTabs, activeTabId: newActiveTabId }];
                }),
            ) as Record<PaneId, PaneState>;

            const leftEmpty = newPanes.left.tabs.length === 0;
            const rightEmpty = newPanes.right.tabs.length === 0;

            if (prev.mode === "split" && (leftEmpty || rightEmpty)) {
                return {
                    mode: "single",
                    focusedPane: "left",
                    panes: {
                        left: leftEmpty ? newPanes.right : newPanes.left,
                        right: { tabs: [], activeTabId: null },
                    },
                };
            }

            return { ...prev, panes: newPanes };
        });

        // API 호출로 서버에서 삭제
        if (docType) {
            deleteEntityMutation.mutate({ id, type: docType });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRenameDocument = useCallback((id: string, newName: string) => {
        // 트리에서 docType 찾기 (트리에 없으면 탭에서 fallback)
        const doc = findDocById(docsRef.current, id);
        let docType = doc?.type;
        if (!docType) {
            const state = splitStateRef.current;
            for (const pid of ["left", "right"] as PaneId[]) {
                const tab = state.panes[pid].tabs.find((t) => t.id === id);
                if (tab?.docType) { docType = tab.docType; break; }
            }
        }

        // 탭 이름 즉시 업데이트 (optimistic)
        setSplitState((prev) => ({
            ...prev,
            panes: Object.fromEntries(
                (["left", "right"] as PaneId[]).map((pid) => [
                    pid,
                    {
                        ...prev.panes[pid],
                        tabs: prev.panes[pid].tabs.map((tab) => {
                            const updatedChildren = tab.children?.map((c) =>
                                c.id === id ? { ...c, name: newName } : c
                            );
                            if (tab.id === id) return { ...tab, name: newName, children: updatedChildren };
                            return { ...tab, children: updatedChildren };
                        }),
                    },
                ]),
            ) as Record<PaneId, PaneState>,
        }));

        // API 호출
        if (docType) {
            updateEntityMutation.mutate({ id, type: docType, name: newName });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFocusPane = useCallback((paneId: PaneId) => {
        setSplitState((prev) => {
            if (prev.focusedPane === paneId) return prev;
            return { ...prev, focusedPane: paneId };
        });
    }, []);

    // 문서 선택 + 최근 방문 기록
    const handleSelectDocumentWithTracking = useCallback((id: string) => {
        handleSelectDocument(id);
        const isSpecial = id === "calendar-view" || id === "kanban-view" || id === "daily-note"
            || !!dailyNotesRef.current?.children?.some(c => c.id === id);
        if (!isSpecial) {
            const doc = findDocById(docsRef.current, id);
            if (doc?.type) {
                updateLastVisitedMutation.mutate({ documentId: id, docType: doc.type });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleSelectDocument]);

    const paneProps = (paneId: PaneId) => ({
        paneId,
        paneState: splitState.panes[paneId],
        isFocused: splitState.focusedPane === paneId,
        isSplit: splitState.mode === "split",
        onClickTab: (tabId: string) => handleClickTab(paneId, tabId),
        onCloseTab: (tabId: string) => handleCloseTab(paneId, tabId),
        onDropTab: handleDropTab,
        onFocusPane: () => handleFocusPane(paneId),
        onOpenDocument: handleSelectDocumentWithTracking,
        onRenameDocument: handleRenameDocument,
        onAddSpace: handleAddSpace,
        draggingTabId,
        onDragStart: setDraggingTabId,
        onDragEnd: () => setDraggingTabId(null),
    });

    return (
        <div className="flex h-screen">
            <ActivityBar
                onSelectItem={handleSelectDocumentWithTracking}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen((v) => !v)}
            />
            <Sidebar
                onSelectSidebarItem={handleSelectDocumentWithTracking}
                docs={docs}
                dailyNotes={dailyNotes}
                onAddItem={handleAddItem}
                onAddSpace={handleAddSpace}
                onDeleteItem={handleDeleteDocument}
                isLoading={isLoading}
                unfoldedIds={unfoldedIds}
                open={sidebarOpen}
            />
            <main className="flex-1 overflow-hidden flex">
                {splitState.mode === "single" ? (
                    <TabPane {...paneProps("left")} />
                ) : (
                    <PanelGroup direction="horizontal">
                        <Panel defaultSize={50} minSize={30}>
                            <TabPane {...paneProps("left")} />
                        </Panel>
                        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/30 transition-colors" />
                        <Panel defaultSize={50} minSize={30}>
                            <TabPane {...paneProps("right")} />
                        </Panel>
                    </PanelGroup>
                )}
            </main>
        </div>
    );
}

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <ErrorBoundary>
                        <Routes>
                            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                            <Route path="/profile-setup" element={<ProfileSetupRoute><ProfileSetupPage /></ProfileSetupRoute>} />
                            <Route path="/app/*" element={<ProtectedRoute><AppContent /></ProtectedRoute>} />
                        </Routes>
                    </ErrorBoundary>
                    <Toaster position="bottom-right" richColors closeButton />
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
};

export default App;
