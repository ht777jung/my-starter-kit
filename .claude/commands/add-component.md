---
description: src/components/ 아래에 React 함수형 컴포넌트 파일과 기본 템플릿을 생성합니다
argument-hint: <ComponentName>
---

컴포넌트 이름: $1

아래 순서대로 작업해줘.

1. **이름 검증**: `$1`이 비어 있거나 PascalCase(대문자로 시작, 영문자와 숫자만 사용)가 아니면 파일을 만들지 말고 사용법(`/add-component <ComponentName>`)을 알려줘.
2. **중복 확인**: `src/components/$1.tsx` 파일이 이미 있으면 덮어쓰지 말고 알려줘.
3. **파일 생성**: `src/components/$1.tsx` 파일을 만들고 아래 템플릿을 사용해줘. `src/components/` 폴더가 없으면 먼저 만들어줘.

```tsx
interface $1Props {
  className?: string;
}

/**
 * $1 컴포넌트
 */
export default function $1({ className }: $1Props) {
  return (
    <div className={`w-full p-4 sm:p-6 ${className ?? ""}`}>
      {/* $1 컴포넌트 내용 */}
    </div>
  );
}
```

4. **규칙 준수**: 생성한 코드는 다음 규칙을 따라야 해.
   - `any` 타입을 사용하지 않는다.
   - 들여쓰기는 2칸, 함수·변수명은 camelCase, 컴포넌트명은 PascalCase를 사용한다.
   - 주석은 한국어로 작성한다.
   - 스타일은 Tailwind CSS 클래스로만 작성하고, 반응형(`sm:`, `md:`, `lg:`)을 고려한다.
5. **결과 보고**: 생성한 파일 경로와 다음에 할 일(props 정의, shadcn/ui 컴포넌트 활용 등)을 짧게 알려줘.

추가 요구사항이 있으면 `$ARGUMENTS`에 전달된 나머지 내용을 템플릿에 반영해줘.
