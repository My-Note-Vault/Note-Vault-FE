import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useDocumentTree } from "./useDocuments";
import { useSpaceList } from "./useSpaces";
import { taskKeys } from "./useTasks";
import { subTaskKeys } from "./useSubTasks";
import { fetchTaskDetail } from "@/api/tasks";
import { fetchSubTaskDetail } from "@/api/subtasks";
import type { SidebarItem, TaskStatus } from "@/types/common";
import type { TaskDetail } from "@/types/task";
import type { SubTaskDetail } from "@/types/subtask";

export interface KanbanItem {
  id: string;
  name: string;
  type: "task" | "subtask";
  status: TaskStatus;
  parentName?: string;
}

export type KanbanColumns = Record<TaskStatus, KanbanItem[]>;

interface TreeItem {
  id: string;
  name: string;
  type: "task" | "subtask";
  parentName?: string;
}

function collectTaskItems(node: SidebarItem, parentName?: string): TreeItem[] {
  const items: TreeItem[] = [];

  if (node.type === "task" || node.type === "subtask") {
    items.push({ id: node.id, name: node.name, type: node.type, parentName });
  }

  if (node.children) {
    const nextParent = node.type === "task" ? node.name : parentName;
    for (const child of node.children) {
      items.push(...collectTaskItems(child, nextParent));
    }
  }

  return items;
}

export function useKanban(spaceId: string | null) {
  const workspaceIdNum = spaceId ? Number(spaceId) : null;
  const { data: docs = [] } = useDocumentTree(workspaceIdNum);
  const { data: spaceList = [] } = useSpaceList();

  const spaces = useMemo(
    () => spaceList.map((s) => ({ id: String(s.id), name: s.name })),
    [spaceList],
  );

  const taskItems = useMemo(() => {
    if (!spaceId) return [];
    const items: TreeItem[] = [];
    for (const doc of docs) {
      items.push(...collectTaskItems(doc));
    }
    return items;
  }, [docs, spaceId]);

  const queries = useQueries({
    queries: taskItems.map((item) => ({
      queryKey:
        item.type === "task"
          ? taskKeys.detail(item.id)
          : subTaskKeys.detail(item.id),
      queryFn: () =>
        item.type === "task"
          ? fetchTaskDetail(item.id)
          : fetchSubTaskDetail(item.id),
      staleTime: 1000 * 30,
      enabled: !!spaceId,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);
  const refetchAll = () => queries.forEach((q) => q.refetch());

  const columns = useMemo<KanbanColumns>(() => {
    const cols: KanbanColumns = {
      NOT_STARTED: [],
      IN_PROGRESS: [],
      COMPLETED: [],
    };

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      const item = taskItems[i];
      if (!query.data) continue;

      const detail = query.data as TaskDetail | SubTaskDetail;
      const status: TaskStatus =
        item.type === "task"
          ? (detail as TaskDetail).status ?? "NOT_STARTED"
          : (detail as SubTaskDetail).metadata?.status ?? "NOT_STARTED";

      cols[status].push({
        id: item.id,
        name: detail.name,
        type: item.type,
        status,
        parentName: item.parentName,
      });
    }

    return cols;
  }, [queries, taskItems]);

  return { columns, isLoading, isError, refetchAll, spaces };
}
