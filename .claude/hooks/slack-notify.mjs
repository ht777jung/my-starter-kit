// Claude Code 훅 → Slack 웹훅 알림 스크립트
// - Notification(permission_prompt): 권한 승인 요청 알림
// - Stop: 작업 완료 알림
// 웹훅 URL은 프로젝트 루트의 .env 파일(SLACK_WEBHOOK_URL)에서 읽습니다.
// 알림 실패가 Claude 작업을 막지 않도록 항상 exit 0으로 종료합니다.

import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseEnv } from "node:util";

const SUMMARY_MAX_LENGTH = 200;
const REQUEST_TIMEOUT_MS = 5000;

/**
 * 프로젝트 루트의 .env 파일을 process.env에 로드합니다.
 * Claude Code는 .env를 자동으로 읽지 않으므로 직접 로드합니다.
 * 이미 값이 있는 환경변수는 덮어쓰지 않고, 빈 문자열은 미설정으로 취급합니다.
 * @returns {void}
 */
function loadProjectEnv() {
  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const envPath = join(projectDir, ".env");
  if (!existsSync(envPath)) return;

  try {
    const parsed = parseEnv(readFileSync(envPath, "utf-8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (error) {
    console.error(`[slack-notify] .env 로드 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Claude Code가 stdin으로 전달하는 훅 입력 형태
 * @typedef {Object} HookInput
 * @property {string} hook_event_name
 * @property {string} [cwd]
 * @property {string} [message]
 * @property {string} [notification_type]
 * @property {string} [last_assistant_message]
 */

/**
 * stdin에서 훅 입력(JSON)을 읽어 파싱합니다.
 * @returns {HookInput | null}
 */
function readHookInput() {
  try {
    const raw = readFileSync(0, "utf-8");
    return raw.trim() ? /** @type {HookInput} */ (JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/**
 * @typedef {Object} SlackMessage
 * @property {string} text 알림 미리보기 및 Block Kit 미지원 클라이언트용 대체 텍스트
 * @property {Object[]} blocks Slack Block Kit 블록 배열
 */

/**
 * 훅 이벤트에 맞는 Slack 메시지를 만듭니다.
 * 상태(상태 값)와 프로젝트를 필드로 나눠 표시합니다.
 * @param {HookInput} input
 * @returns {SlackMessage | null} 알림이 필요 없는 이벤트면 null
 */
function buildMessage(input) {
  const project = input.cwd ? basename(input.cwd) : "unknown-project";

  /** @type {{ emoji: string, status: string, detail: string } | null} */
  let content = null;

  if (input.hook_event_name === "Notification") {
    // 권한 승인 요청만 알림으로 보냅니다. 다른 알림 유형은 무시합니다.
    if (input.notification_type !== "permission_prompt") return null;
    content = {
      emoji: "🔐",
      status: "권한 요청",
      detail: input.message ?? "Claude가 권한 승인을 기다리고 있습니다.",
    };
  } else if (input.hook_event_name === "Stop") {
    content = {
      emoji: "✅",
      status: "작업 완료",
      detail: (input.last_assistant_message ?? "").slice(0, SUMMARY_MAX_LENGTH),
    };
  }

  if (!content) return null;

  const statusText = `${content.emoji} ${content.status}`;
  const blocks = [
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*상태*\n${statusText}` },
        { type: "mrkdwn", text: `*프로젝트*\n${project}` },
      ],
    },
  ];

  if (content.detail) {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: content.detail } });
  }

  return { text: `${statusText} (${project})`, blocks };
}

/**
 * Slack 웹훅으로 메시지를 전송합니다.
 * @param {string} url
 * @param {SlackMessage} message
 * @returns {Promise<void>}
 */
async function sendToSlack(url, message) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Slack 응답 오류: ${response.status} ${response.statusText}`);
  }
}

async function main() {
  loadProjectEnv();

  const input = readHookInput();
  if (!input) return;

  const message = buildMessage(input);
  if (!message) return;

  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.error("[slack-notify] SLACK_WEBHOOK_URL이 설정되지 않아 알림을 건너뜁니다.");
    return;
  }

  try {
    await sendToSlack(url, message);
  } catch (error) {
    console.error(`[slack-notify] 전송 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}

main().finally(() => process.exit(0));
