import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

// ─── Widgets ───────────────────────────────────────────────────────────────

class HRWidget extends WidgetType {
  eq(other: WidgetType) {
    return other instanceof HRWidget;
  }
  toDOM() {
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.className = "cm-md-hr-widget";
    return el;
  }
  ignoreEvent() {
    return true;
  }
}

class BulletWidget extends WidgetType {
  constructor(readonly char: string) {
    super();
  }
  eq(other: WidgetType) {
    return other instanceof BulletWidget && other.char === this.char;
  }
  toDOM() {
    const el = document.createElement("span");
    el.className = "cm-md-bullet-widget";
    el.textContent = "•";
    return el;
  }
  ignoreEvent() {
    return true;
  }
}

// ─── Static Decorations ────────────────────────────────────────────────────

const replace = Decoration.replace({});

const headingLineDecs = [1, 2, 3, 4, 5, 6].map((n) =>
  Decoration.line({ class: `cm-md-heading cm-md-h${n}` })
);

const boldDec = Decoration.mark({ class: "cm-md-bold", inclusive: false });
const italicDec = Decoration.mark({ class: "cm-md-italic", inclusive: false });
const boldItalicDec = Decoration.mark({ class: "cm-md-bold cm-md-italic", inclusive: false });
const inlineCodeDec = Decoration.mark({ class: "cm-md-inline-code", inclusive: false });
const strikeDec = Decoration.mark({ class: "cm-md-strike", inclusive: false });
const linkDec = Decoration.mark({ class: "cm-md-link", inclusive: false });
const codeBlockDec = Decoration.line({ class: "cm-md-code-block" });
const quoteLineDec = Decoration.line({ class: "cm-md-quote" });

// ─── Helpers ───────────────────────────────────────────────────────────────

function getCursorLines(view: EditorView): Set<number> {
  // 포커스 없으면 커서 라인 없음 → 모든 줄에 decoration 적용
  if (!view.hasFocus) return new Set();

  const lines = new Set<number>();
  for (const range of view.state.selection.ranges) {
    const startLine = view.state.doc.lineAt(range.from).number;
    const endLine = view.state.doc.lineAt(range.to).number;
    for (let n = startLine; n <= endLine; n++) lines.add(n);
  }
  return lines;
}

type Entry = { from: number; to: number; dec: Decoration };

// ─── Build ─────────────────────────────────────────────────────────────────

function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view;
  const cursorLines = getCursorLines(view);
  const entries: Entry[] = [];

  function onCursorLine(pos: number): boolean {
    return cursorLines.has(state.doc.lineAt(pos).number);
  }

  /** 여러 줄 노드에 줄 단위 line decoration 추가 */
  function addLineDec(from: number, to: number, dec: Decoration) {
    let pos = from;
    while (pos <= to && pos < state.doc.length) {
      const line = state.doc.lineAt(pos);
      if (line.from >= from && !onCursorLine(line.from)) {
        entries.push({ from: line.from, to: line.from, dec });
      }
      if (line.to >= to) break;
      pos = line.to + 1;
    }
  }

  syntaxTree(state).iterate({
    enter(node) {
      // ── Headings ──────────────────────────────────────────────────────
      if (/^ATXHeading[1-6]$/.test(node.name)) {
        const level = parseInt(node.name.slice(-1)) - 1;
        const lineFrom = state.doc.lineAt(node.from).from;
        if (!onCursorLine(node.from)) {
          entries.push({ from: lineFrom, to: lineFrom, dec: headingLineDecs[level] });
        }
        return; // 자식(HeaderMark) iterate
      }

      if (node.name === "HeaderMark") {
        if (!onCursorLine(node.from)) {
          // `# ` 뒤 공백까지 포함해서 숨기기
          let end = node.to;
          if (state.doc.sliceString(end, end + 1) === " ") end++;
          entries.push({ from: node.from, to: end, dec: replace });
        }
        return false;
      }

      // ── Bold / Italic ─────────────────────────────────────────────────
      if (node.name === "StrongEmphasis") {
        if (!onCursorLine(node.from)) {
          // *** → bold+italic 판별
          const firstChild = node.node.firstChild;
          const isBoldItalic =
            firstChild?.name === "EmphasisMark" &&
            state.doc.sliceString(firstChild.from, firstChild.to).length >= 3;
          entries.push({
            from: node.from,
            to: node.to,
            dec: isBoldItalic ? boldItalicDec : boldDec,
          });
        }
        return; // EmphasisMark 자식 iterate
      }

      if (node.name === "Emphasis") {
        // StrongEmphasis 자식이면 별도 italic 데코 불필요 (이미 boldItalicDec)
        const inStrong = node.node.parent?.name === "StrongEmphasis";
        if (!inStrong && !onCursorLine(node.from)) {
          entries.push({ from: node.from, to: node.to, dec: italicDec });
        }
        return;
      }

      if (node.name === "EmphasisMark") {
        if (!onCursorLine(node.from)) {
          entries.push({ from: node.from, to: node.to, dec: replace });
        }
        return false;
      }

      // ── Inline Code ───────────────────────────────────────────────────
      if (node.name === "InlineCode") {
        if (!onCursorLine(node.from)) {
          entries.push({ from: node.from, to: node.to, dec: inlineCodeDec });
        }
        return; // CodeMark 자식 iterate
      }

      if (node.name === "CodeMark") {
        const inFenced = node.node.parent?.name === "FencedCode";
        if (!inFenced && !onCursorLine(node.from)) {
          entries.push({ from: node.from, to: node.to, dec: replace });
        }
        return false;
      }

      // ── Fenced Code Block ─────────────────────────────────────────────
      if (node.name === "FencedCode") {
        addLineDec(node.from, node.to, codeBlockDec);
        return false; // 내부 CodeMark 숨기지 않음
      }

      if (node.name === "CodeInfo") {
        // 언어 이름 숨기기 (``` 뒤에 오는 "js", "python" 등)
        if (!onCursorLine(node.from)) {
          entries.push({ from: node.from, to: node.to, dec: replace });
        }
        return false;
      }

      // ── Links ─────────────────────────────────────────────────────────
      if (node.name === "Link" || node.name === "Image") {
        if (!onCursorLine(node.from)) {
          entries.push({ from: node.from, to: node.to, dec: linkDec });
        }
        return; // LinkMark / URL 자식 iterate
      }

      if (node.name === "LinkMark") {
        if (!onCursorLine(node.from)) {
          entries.push({ from: node.from, to: node.to, dec: replace });
        }
        return false;
      }

      if (node.name === "URL") {
        if (!onCursorLine(node.from)) {
          // `(url)` 괄호 포함 숨기기
          const before = state.doc.sliceString(node.from - 1, node.from);
          const after = state.doc.sliceString(node.to, node.to + 1);
          const from = before === "(" ? node.from - 1 : node.from;
          const to = after === ")" ? node.to + 1 : node.to;
          entries.push({ from, to, dec: replace });
        }
        return false;
      }

      // ── Horizontal Rule ───────────────────────────────────────────────
      if (node.name === "HorizontalRule") {
        if (!onCursorLine(node.from)) {
          const line = state.doc.lineAt(node.from);
          entries.push({
            from: line.from,
            to: line.to,
            dec: Decoration.replace({ widget: new HRWidget() }),
          });
        }
        return false;
      }

      // ── Blockquote ────────────────────────────────────────────────────
      if (node.name === "Blockquote") {
        addLineDec(node.from, node.to, quoteLineDec);
        return; // QuoteMark 자식 iterate
      }

      if (node.name === "QuoteMark") {
        if (!onCursorLine(node.from)) {
          let end = node.to;
          if (state.doc.sliceString(end, end + 1) === " ") end++;
          entries.push({ from: node.from, to: end, dec: replace });
        }
        return false;
      }

      // ── Strikethrough (GFM) ───────────────────────────────────────────
      if (node.name === "Strikethrough") {
        if (!onCursorLine(node.from)) {
          entries.push({ from: node.from, to: node.to, dec: strikeDec });
        }
        return;
      }

      if (node.name === "StrikethroughMark") {
        if (!onCursorLine(node.from)) {
          entries.push({ from: node.from, to: node.to, dec: replace });
        }
        return false;
      }

      // ── List Marks ────────────────────────────────────────────────────
      if (node.name === "ListMark") {
        if (!onCursorLine(node.from)) {
          const mark = state.doc.sliceString(node.from, node.to);
          if (mark === "-" || mark === "*" || mark === "+") {
            entries.push({
              from: node.from,
              to: node.to,
              dec: Decoration.replace({ widget: new BulletWidget(mark) }),
            });
          }
          // 순서 있는 목록 (1. 2. ...)은 그대로 둠
        }
        return false;
      }
    },
  });

  // from 오름차순, 같으면 to 오름차순 (line dec이 mark dec보다 먼저)
  entries.sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from;
    return a.to - b.to;
  });

  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to, dec } of entries) {
    try {
      builder.add(from, to, dec);
    } catch {
      // 정렬 오류 무시 (edge case)
    }
  }

  return builder.finish();
}

// ─── Plugin ────────────────────────────────────────────────────────────────

export const markdownDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged ||
        update.focusChanged ||
        // 언어 파서 완료 시 StateEffect를 담은 트랜잭션이 dispatch됨
        update.transactions.some((tr) => tr.effects.length > 0)
      ) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);
