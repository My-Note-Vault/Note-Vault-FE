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
      sendKeepaliveJsonRequest(endpoints.DOCUMENT_DETAIL("TASK", id), {
        method: "PATCH",
        body: { content },
      });
      return;
    case "subtask":
      sendKeepaliveJsonRequest(endpoints.DOCUMENT_DETAIL("SUBTASK", id), {
        method: "PATCH",
        body: { content },
      });
      return;
    case "note":
      sendKeepaliveJsonRequest(endpoints.DOCUMENT_DETAIL("NOTE", id), {
        method: "PATCH",
        body: { content },
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
