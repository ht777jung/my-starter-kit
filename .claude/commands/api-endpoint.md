---
description: Next.js Route Handler를 Zod 입력 검증, 공통 응답 형식, try/catch 에러 처리, DB 트랜잭션을 포함해 생성합니다
argument-hint: <resourceName> [GET|POST|PUT|PATCH|DELETE]
---

리소스 이름: $1
HTTP 메서드: $2 (비어 있으면 `GET`과 `POST`를 함께 만들어줘)

아래 순서대로 작업해줘.

1. **입력 검증**: `$1`이 비어 있거나 소문자 영문과 하이픈(`-`)만 사용하지 않으면 파일을 만들지 말고 사용법(`/api-endpoint <resourceName> [METHOD]`)을 알려줘.
2. **기존 구조 확인**: `src/` 아래의 DB 클라이언트(Prisma, Drizzle 등), 공통 응답 유틸, 기존 `route.ts`를 먼저 찾아 있으면 그 방식을 그대로 따라줘. 없으면 아래 기본 구조를 사용해.
3. **파일 구성** (레이어드 아키텍처: Controller → Service → Repository):
   - `src/app/api/$1/route.ts`: Route Handler(Controller). 요청 파싱, Zod 검증, Service 호출만 담당한다.
   - `src/server/$1/$1.schema.ts`: Zod 스키마와 요청/응답 DTO 타입
   - `src/server/$1/$1.service.ts`: 비즈니스 로직, DB 트랜잭션 처리
   - `src/server/$1/$1.repository.ts`: DB 접근만 담당
   - `src/server/response.ts`: 공통 응답 헬퍼가 없을 때만 생성
4. **공통 응답 형식**: 모든 응답은 아래 형식을 따른다.
   ```ts
   type ApiResponse<T> =
     | { success: true; data: T; error: null }
     | { success: false; data: null; error: { code: string; message: string } };
   ```
5. **Route Handler 템플릿** (`route.ts`):
   - 요청 본문은 `request.json()`으로 읽고, 파싱 실패와 Zod 검증 실패는 `400`으로 응답한다. Zod 실패 시 `error.code`는 `VALIDATION_ERROR`로 한다.
   - `try/catch`로 감싸고, catch에서는 에러를 로그로 남기고 `500`과 `INTERNAL_SERVER_ERROR`를 반환한다. 에러 메시지를 클라이언트에 그대로 노출하지 않는다.
   - 메서드마다 `export async function GET | POST | ...`로 구현한다.
6. **트랜잭션**: 쓰기 작업(POST, PUT, PATCH, DELETE)은 Service에서 트랜잭션으로 묶는다. 사용하는 ORM의 트랜잭션 API를 쓰고, ORM을 정할 수 없으면 `// TODO: DB 트랜잭션 연결` 주석을 남기고 사용자에게 알려준다.
7. **규칙 준수**:
   - `any` 타입을 사용하지 않는다. 알 수 없는 입력은 `unknown`으로 받고 Zod로 검증한다.
   - 들여쓰기는 2칸, 변수·함수명은 camelCase, 파일명은 kebab-case 또는 `$1.*.ts` 형식을 따른다.
   - 주석은 한국어로 작성한다.
8. **결과 보고**: 생성한 파일 목록, 각 메서드의 요청/응답 예시, 확인이 필요한 TODO 항목을 짧게 알려줘. 코드는 실행하지 않았으므로 타입 체크(`npx tsc --noEmit`)를 권장한다고 덧붙여줘.

추가 요구사항이 있으면 `$ARGUMENTS`에 전달된 나머지 내용을 반영해줘.
