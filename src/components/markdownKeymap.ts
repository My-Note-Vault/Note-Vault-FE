import { EditorView, keymap } from "@codemirror/view";
import { EditorSelection, type Extension } from "@codemirror/state";

/**
 * 선택 영역을 marker로 감싸거나, 이미 감싸져 있으면 제거 (toggle).
 * 선택 없으면 marker 쌍 삽입 후 커서를 그 사이에 위치.
 */
function toggleMark(view: EditorView, marker: string): boolean {
  const { state } = view;
  const mLen = marker.length;

  const changes = state.changeByRange((range) => {
    // ── 선택 없음: 마커 쌍 삽입 + 커서 사이에 ─────────────────────────
    if (range.empty) {
      return {
        changes: { from: range.from, insert: marker + marker },
        range: EditorSelection.cursor(range.from + mLen),
      };
    }

    const text = state.sliceDoc(range.from, range.to);

    // ── Case 1: 선택 영역 자체가 마커 포함 (예: **텍스트** 전체 선택) ──
    if (
      text.startsWith(marker) &&
      text.endsWith(marker) &&
      text.length > mLen * 2
    ) {
      return {
        changes: [
          { from: range.from, to: range.from + mLen },
          { from: range.to - mLen, to: range.to },
        ],
        range: EditorSelection.range(range.from, range.to - mLen * 2),
      };
    }

    // ── Case 2: 선택 영역 바깥에 마커 있음 (이미 적용된 상태) ───────────
    if (range.from >= mLen) {
      const before = state.sliceDoc(range.from - mLen, range.from);
      const after = state.sliceDoc(range.to, range.to + mLen);
      if (before === marker && after === marker) {
        return {
          changes: [
            { from: range.from - mLen, to: range.from },
            { from: range.to, to: range.to + mLen },
          ],
          range: EditorSelection.range(range.from - mLen, range.to - mLen),
        };
      }
    }

    // ── Case 3: 마커 추가 (선택 텍스트는 안쪽에 유지) ───────────────────
    return {
      changes: [
        { from: range.from, insert: marker },
        { from: range.to, insert: marker },
      ],
      range: EditorSelection.range(range.from + mLen, range.to + mLen),
    };
  });

  view.dispatch(
    state.update(changes, { scrollIntoView: true, userEvent: "input" })
  );
  return true;
}

/**
 * 옵시디언 스타일 마크다운 단축키
 *
 * Cmd/Ctrl + B         → **굵게**
 * Cmd/Ctrl + I         → *기울임*
 * Cmd/Ctrl + `         → `인라인 코드`
 * Cmd/Ctrl + Shift + S → ~~취소선~~
 */
export const obsidianKeymap: Extension = keymap.of([
  { key: "Mod-b", run: (view) => toggleMark(view, "**") },
  { key: "Mod-i", run: (view) => toggleMark(view, "*") },
  { key: "Mod-`", run: (view) => toggleMark(view, "`") },
  { key: "Mod-Shift-s", run: (view) => toggleMark(view, "~~") },
]);
