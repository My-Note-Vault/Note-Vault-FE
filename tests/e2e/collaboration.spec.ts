import { expect, test, type APIRequestContext, type Browser, type Page } from "@playwright/test";

type DocType = "space" | "task" | "note";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface OpenDocumentOptions extends TokenPair {
  workspaceId: string;
  tabId: string;
  docType: DocType;
  documentTitle: string;
}

const workspaceId = process.env.E2E_WORKSPACE_ID;
const documentId = process.env.E2E_DOCUMENT_ID;
const docType = (process.env.E2E_DOC_TYPE ?? "note") as DocType;
const documentTitle = process.env.E2E_DOCUMENT_TITLE ?? `E2E ${docType} ${documentId ?? "document"}`;
const userAId = process.env.E2E_USER_A_ID ?? "1";
const userBId = process.env.E2E_USER_B_ID ?? "2";

const tabId = documentId ? `${docType}-${documentId}` : "";

function pathForTab(tab: string, type: DocType) {
  const entityId = tab.replace(/^(?:space|task|note)-/, "");
  const segmentByType: Record<DocType, string> = {
    space: "workspaces/information",
    task: "tasks",
    note: "note",
  };

  return `/api/v1/${segmentByType[type]}/${entityId}`;
}

async function devLogin(request: APIRequestContext, userId: string): Promise<TokenPair> {
  const response = await request.get("/api/v1/oauth/dev", {
    params: { userId },
    headers: {
      Accept: "application/json",
    },
  });

  expect(response.ok(), await response.text()).toBeTruthy();

  const contentType = response.headers()["content-type"] ?? "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Dev login returned ${contentType || "an unknown content type"} instead of JSON: ${text.slice(0, 200)}`,
    );
  }

  const body = JSON.parse(text);
  const token = body.token ?? body;

  if (!token?.accessToken) {
    throw new Error(`Dev login did not return an accessToken for userId=${userId}`);
  }

  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken ?? "",
  };
}

async function expectReadableDocument(
  request: APIRequestContext,
  token: TokenPair,
  userLabel: string,
) {
  const detailPath = pathForTab(tabId, docType);
  const response = await request.get(detailPath, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `${userLabel} cannot read ${docType}-${documentId} via ${detailPath}. ` +
      `HTTP ${response.status()}: ${(await response.text()).slice(0, 500)}`,
    );
  }
}

async function openDocument(browser: Browser, options: OpenDocumentOptions) {
  const context = await browser.newContext();

  await context.addInitScript((state) => {
    localStorage.setItem("accessToken", state.accessToken);
    if (state.refreshToken) {
      localStorage.setItem("refreshToken", state.refreshToken);
    }
    localStorage.setItem("selected_workspace", state.workspaceId);
    localStorage.setItem("last_visited", state.lastVisitedPath);
    localStorage.setItem(
      "splitState",
      JSON.stringify({
        mode: "single",
        focusedPane: "left",
        panes: {
          left: {
            tabs: [
              {
                id: state.tabId,
                name: state.documentTitle,
                isDaily: false,
                docType: state.docType,
                children: [],
              },
            ],
            activeTabId: state.tabId,
          },
          right: { tabs: [], activeTabId: null },
        },
      }),
    );
  }, {
    ...options,
    lastVisitedPath: pathForTab(options.tabId, options.docType),
  });

  const page = await context.newPage();
  await page.goto(`/app?tab=${encodeURIComponent(options.tabId)}`);
  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByText("Offline")).toHaveCount(0, { timeout: 30_000 });
  await expect(page.locator(".cm-content").first()).toBeVisible({
    timeout: 30_000,
  });

  return { context, page };
}

async function appendText(page: Page, text: string) {
  const editor = page.locator(".cm-content").first();
  await editor.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+ArrowDown" : "Control+End");
  await editor.pressSequentially(text, { delay: 15 });
}

async function editorText(page: Page) {
  return page.locator(".cm-content").first().innerText();
}

test.describe("collaborative editor", () => {
  test.skip(
    !workspaceId || !documentId,
    "Set E2E_WORKSPACE_ID and E2E_DOCUMENT_ID to an existing shared document.",
  );

  test("syncs edits from two browser contexts", async ({ browser, request }) => {
    const [userA, userB] = await Promise.all([
      devLogin(request, userAId),
      devLogin(request, userBId),
    ]);

    await Promise.all([
      expectReadableDocument(request, userA, `user ${userAId}`),
      expectReadableDocument(request, userB, `user ${userBId}`),
    ]);

    const [sessionA, sessionB] = await Promise.all([
      openDocument(browser, {
        ...userA,
        workspaceId: workspaceId!,
        tabId,
        docType,
        documentTitle,
      }),
      openDocument(browser, {
        ...userB,
        workspaceId: workspaceId!,
        tabId,
        docType,
        documentTitle,
      }),
    ]);

    const runId = Date.now();
    const markerA = ` [playwright-a-${runId}] `;
    const markerB = ` [playwright-b-${runId}] `;

    await Promise.all([
      appendText(sessionA.page, markerA),
      appendText(sessionB.page, markerB),
    ]);

    await expect.poll(() => editorText(sessionA.page), { timeout: 30_000 }).toContain(markerA);
    await expect.poll(() => editorText(sessionA.page), { timeout: 30_000 }).toContain(markerB);
    await expect.poll(() => editorText(sessionB.page), { timeout: 30_000 }).toContain(markerA);
    await expect.poll(() => editorText(sessionB.page), { timeout: 30_000 }).toContain(markerB);

    await sessionA.context.close();
    await sessionB.context.close();
  });
});
