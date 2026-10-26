# LLMTranslate

지정한 LLM 서버로 메시지를 번역하고, 원문 아래에 본인에게만 보이는 결과를 표시하는 Vencord 플러그인입니다.

## 설치

Vencord 최상위 폴더에서 실행합니다.

```text
cd src/userplugins
git clone https://github.com/slopization/vc-LLMTranslate.git
cd ../..
pnpm build
pnpm inject
```

Discord를 재시작하고 `LLMTranslate`를 활성화합니다.\
플러그인 설정에 API 유형, 전체 API 주소, 모델과 API 키를 입력합니다.\
OpenAI 호환, Anthropic, Gemini를 지원합니다.

## 사용

- 메시지의 `LLM 번역`을 누르면 바로 번역합니다. 결과를 복사하거나 숨길 수 있습니다.
- 기본값은 자동 감지와 한국어이며, 설정에서 언어를 변경할 수 있습니다.
- 채팅 입력창 옆 버튼으로 작성할 글도 번역할 수 있습니다.

## 업데이트

Vencord 최상위 폴더에서 실행한 뒤 Discord를 완전히 종료하고 다시 실행합니다.

```text
git -C src/userplugins/vc-LLMTranslate pull --ff-only
pnpm build
pnpm inject
```

[Vencord 설치 안내](https://docs.vencord.dev/installing/custom-plugins/) | [MIT License](LICENSE)
