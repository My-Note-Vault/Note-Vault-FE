import { useState, useCallback, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import Sidebar, { DUMMY_DAILY_NOTES, type SidebarDocument, type DocType } from "./components/Sidebar";
import TabPane, { type PaneId, type PaneState } from "./components/TabPane";

const queryClient = new QueryClient();

function findDocById(docs: SidebarDocument[], id: string): SidebarDocument | null {
    for (const doc of docs) {
        if (doc.id === id) return doc;
        if (doc.children) {
            const found = findDocById(doc.children, id);
            if (found) return found;
        }
    }
    return null;
}

function renameDocById(docs: SidebarDocument[], id: string, newName: string): SidebarDocument[] {
    return docs.map((doc) => {
        if (doc.id === id) return { ...doc, name: newName };
        if (doc.children) return { ...doc, children: renameDocById(doc.children, id, newName) };
        return doc;
    });
}

function addChildToDoc(docs: SidebarDocument[], parentId: string, child: SidebarDocument): SidebarDocument[] {
    return docs.map((doc) => {
        if (doc.id === parentId) {
            return { ...doc, children: [...(doc.children ?? []), child] };
        }
        if (doc.children) {
            return { ...doc, children: addChildToDoc(doc.children, parentId, child) };
        }
        return doc;
    });
}

const CHILD_TYPE_MAP: Record<DocType, DocType | null> = {
    space: "task",
    task: "subtask",
    subtask: "trivia",
    trivia: null,
};

const TYPE_LABELS: Record<DocType, string> = {
    space: "새 Space",
    task: "새 Task",
    subtask: "새 Sub Task",
    trivia: "새 Trivia",
};

interface SplitState {
    mode: "single" | "split";
    focusedPane: PaneId;
    panes: Record<PaneId, PaneState>;
}

const App = () => {
    const [docs, setDocs] = useState<SidebarDocument[]>([]);
    const [splitState, setSplitState] = useState<SplitState>({
        mode: "single",
        focusedPane: "left",
        panes: {
            left: { tabs: [], activeTabId: null },
            right: { tabs: [], activeTabId: null },
        },
    });
    const [draggingTabId, setDraggingTabId] = useState<string | null>(null);

    const handleSelectDocument = useCallback((id: string) => {
        const isDaily = id.startsWith("daily-");
        const doc = findDocById([DUMMY_DAILY_NOTES, ...docsRef.current], id);
        const name = doc?.name ?? id;
        const docType = doc?.type;
        const children = doc?.children
            ?.filter((c) => !c.children || c.type)
            ?.map((c) => ({ id: c.id, name: c.name })) ?? [];

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
                        tabs: [{ id, name, isDaily, docType, children }, ...pane.tabs].slice(0, 4),
                        activeTabId: id,
                    },
                },
            };
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const docsRef = useRef(docs);
    docsRef.current = docs;

    const handleAddItem = useCallback((parentId: string) => {
        setDocs((prev) => {
            const parent = findDocById(prev, parentId);
            if (!parent?.type) return prev;
            const childType = CHILD_TYPE_MAP[parent.type];
            if (!childType) return prev;

            const child: SidebarDocument = {
                id: `${childType}-${Date.now()}`,
                name: TYPE_LABELS[childType],
                type: childType,
                children: childType !== "trivia" ? [] : undefined,
            };

            return addChildToDoc(prev, parentId, child);
        });
    }, []);

    const handleAddSpace = useCallback(() => {
        const id = `space-${Date.now()}`;
        const name = "새 Space";
        setDocs((prev) => [
            ...prev,
            { id, name, type: "space" as DocType, children: [] },
        ]);
        return id;
    }, []);

    const handleAddSpaceAndOpen = useCallback(() => {
        const id = handleAddSpace();
        const name = "새 Space";
        setSplitState((prev) => {
            const targetPaneId = prev.focusedPane;
            const pane = prev.panes[targetPaneId];
            if (pane.tabs.some((t) => t.id === id)) {
                return { ...prev, panes: { ...prev.panes, [targetPaneId]: { ...pane, activeTabId: id } } };
            }
            if (pane.tabs.length >= 4) return prev;
            return {
                ...prev,
                panes: {
                    ...prev.panes,
                    [targetPaneId]: {
                        tabs: [{ id, name, isDaily: false, docType: "space" as DocType, children: [] }, ...pane.tabs].slice(0, 4),
                        activeTabId: id,
                    },
                },
            };
        });
    }, [handleAddSpace]);

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

    const handleRenameDocument = useCallback((id: string, newName: string) => {
        // Update sidebar document tree
        setDocs((prev) => renameDocById(prev, id, newName));

        // Update tab name + children references in all panes
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
    }, []);

    const handleFocusPane = useCallback((paneId: PaneId) => {
        setSplitState((prev) => {
            if (prev.focusedPane === paneId) return prev;
            return { ...prev, focusedPane: paneId };
        });
    }, []);

    const paneProps = (paneId: PaneId) => ({
        paneId,
        paneState: splitState.panes[paneId],
        isFocused: splitState.focusedPane === paneId,
        isSplit: splitState.mode === "split",
        onClickTab: (tabId: string) => handleClickTab(paneId, tabId),
        onCloseTab: (tabId: string) => handleCloseTab(paneId, tabId),
        onDropTab: handleDropTab,
        onFocusPane: () => handleFocusPane(paneId),
        onOpenDocument: handleSelectDocument,
        onRenameDocument: handleRenameDocument,
        onAddSpace: handleAddSpaceAndOpen,
        draggingTabId,
        onDragStart: setDraggingTabId,
        onDragEnd: () => setDraggingTabId(null),
    });

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <div className="flex h-screen">
                        <Sidebar
                            onSelectSidebarDocument={handleSelectDocument}
                            docs={docs}
                            onAddItem={handleAddItem}
                            onAddSpace={handleAddSpace}
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
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
};

export default App;
