#!/usr/bin/env bash
# Claude Code Notification 훅 래퍼
# stdin으로 들어온 훅 입력을 slack-notify.mjs에 그대로 전달합니다.
# 알림 실패가 Claude 작업을 막지 않도록 항상 exit 0으로 종료합니다.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

node "$SCRIPT_DIR/slack-notify.mjs" || true
exit 0
