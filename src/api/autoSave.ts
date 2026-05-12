import { sendKeepaliveJsonRequest } from "./client";
import { endpoints } from "@/constants/endpoints";
import type { DocType } from "@/types/common";

export function sendKeepaliveEntityAutoSave(
  id: string,
  type: DocType,
  content: string,
): void {
  switch (type) {
    case "space":
      sendKeepaliveJsonRequest(endpoints.SPACES, {
        method: "PATCH",
        body: { workSpaceId: id, isPublic: false, content },
      });
      return;
    case "task":
      sendKeepaliveJsonRequest(endpoints.TASKS, {
        method: "PATCH",
        body: { taskId: id, content },
      });
      return;
    case "subtask":
      sendKeepaliveJsonRequest(endpoints.SUBTASKS, {
        method: "PATCH",
        body: { subTaskId: id, content },
      });
      return;
    case "trivia":
      sendKeepaliveJsonRequest(endpoints.TRIVIAS, {
        method: "PATCH",
        body: { triviaId: id, content },
      });
      return;
  }
}

export function sendKeepaliveDailyNoteAutoSave(
  dailyNoteId: number,
  content: string,
): void {
  sendKeepaliveJsonRequest(endpoints.DAILY_NOTE_DETAIL(dailyNoteId), {
    method: "PATCH",
    body: { content },
  });
}
