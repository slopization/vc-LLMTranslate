import { Button } from "@components/Button";
import { Paragraph } from "@components/Paragraph";
import { SettingsSection } from "@components/settings/tabs/plugins/components/Common";
import { TextArea, useEffect, useState } from "@webpack/common";

import { cancelTranslation, runTranslation } from "../utils/bridge";
import { LanguageSettings } from "./LanguageSettings";
import { createTranslationInput, settings } from "../settings";

export interface TranslatorProps {
    initialText?: string;
    onApply?: (text: string) => boolean;
}

export function Translator({ initialText = "", onApply }: TranslatorProps) {
    const [id] = useState(() => crypto.randomUUID());
    const [owner] = useState(() => Symbol("translation"));
    const [request, setRequest] = useState<AbortController | null>(null);
    const [text, setText] = useState(initialText);
    const { sourceLanguage, targetLanguage } = settings.use(["sourceLanguage", "targetLanguage"]);
    const [output, setOutput] = useState("");
    const [outputLanguages, setOutputLanguages] = useState({ sourceLanguage, targetLanguage });
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        return () => {
            void cancelTranslation(owner).catch(() => {});
        };
    }, [owner]);

    async function translate() {
        if (busy) return;
        const current = new AbortController();
        setRequest(current);
        setBusy(true);
        setOutput("");
        setOutputLanguages({ sourceLanguage, targetLanguage });
        setNotice("");
        setError("");
        try {
            const result = await runTranslation(owner, createTranslationInput(text));
            if (current.signal.aborted) return;
            if (result.ok) setOutput(result.value);
            else setError(result.error.detail);
        } catch {
            if (!current.signal.aborted) setError("번역 요청을 처리하지 못했습니다. 연결 설정을 확인해 주십시오.");
        } finally {
            if (!current.signal.aborted) setBusy(false);
        }
    }

    async function cancel() {
        request?.abort();
        setNotice("번역을 취소했습니다.");
        try {
            await cancelTranslation(owner);
        } catch {
            setError("취소 요청을 전달하지 못했습니다. 잠시 후 다시 시도해 주십시오.");
        } finally {
            setBusy(false);
        }
    }

    function invalidate() {
        setOutput("");
        setNotice("");
        setError("");
    }

    return (
        <section className="llm-translate" aria-label="LLM 번역">
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void translate();
                }}
            >
                <fieldset disabled={busy} className="llm-translate-fields">
                    <SettingsSection name="원문" id={`${id}-source`} description="">
                        <TextArea
                            id={`${id}-source`}
                            aria-label="원문"
                            value={text}
                            maxLength={12000}
                            rows={4}
                            required
                            disabled={busy}
                            onChange={(value) => {
                                setText(value);
                                invalidate();
                            }}
                        />
                    </SettingsSection>
                    <LanguageSettings disabled={busy} />
                    <div className="llm-translate-actions">
                        <Button type="submit" disabled={!text.trim()}>
                            번역
                        </Button>
                    </div>
                </fieldset>
            </form>
            {busy && (
                <div className="llm-translate-actions" role="status">
                    <span>번역 중입니다.</span>
                    <Button variant="secondary" onClick={() => void cancel()}>
                        번역 취소
                    </Button>
                </div>
            )}
            {output &&
                outputLanguages.sourceLanguage === sourceLanguage &&
                outputLanguages.targetLanguage === targetLanguage && (
                    <div className="llm-translate-result">
                        <SettingsSection name="번역 결과" id={`${id}-result`} description="">
                            <TextArea
                                id={`${id}-result`}
                                aria-label="번역 결과"
                                value={output}
                                rows={4}
                                readOnly
                                onChange={() => {}}
                            />
                        </SettingsSection>
                        <div className="llm-translate-actions">
                            <Button
                                variant="secondary"
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(output);
                                        setNotice("번역 결과를 복사했습니다.");
                                    } catch {
                                        setError("복사하지 못했습니다. 번역 결과를 선택하여 복사해 주십시오.");
                                    }
                                }}
                            >
                                결과 복사
                            </Button>
                            {onApply && (
                                <Button
                                    onClick={() => {
                                        if (onApply(output))
                                            setNotice(
                                                "입력창에 번역 결과를 추가했습니다. 내용을 확인한 뒤 전송해 주십시오.",
                                            );
                                        else
                                            setError(
                                                "입력창이나 채널이 변경되었습니다. 번역 결과를 복사하여 사용해 주십시오.",
                                            );
                                    }}
                                >
                                    입력창에 추가
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            {notice && <Paragraph role="status">{notice}</Paragraph>}
            {error && <Paragraph role="alert">{error}</Paragraph>}
        </section>
    );
}
