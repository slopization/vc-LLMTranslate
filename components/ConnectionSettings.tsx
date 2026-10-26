import { Button } from "@components/Button";
import { useEffect, useState } from "@webpack/common";

import { Native } from "../utils/bridge";
import { LanguageSettings } from "./LanguageSettings";
import type { Provider, PublicConnection } from "../types";

const endpointExamples: Record<Provider, string> = {
    openai: "https://router.example.com/v1/chat/completions",
    anthropic: "https://router.example.com/v1/messages",
    gemini: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
};

export function ConnectionSettings() {
    const [id] = useState(() => crypto.randomUUID());
    const [provider, setProvider] = useState<Provider>("openai");
    const [endpoint, setEndpoint] = useState("");
    const [model, setModel] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [persist, setPersist] = useState(false);
    const [saved, setSaved] = useState<PublicConnection | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [loadFailed, setLoadFailed] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        Native.getConnection()
            .then((result) => {
                if (!active) return;
                if (!result.ok) {
                    setLoadFailed(true);
                    setError(result.error.detail);
                    return;
                }
                setSaved(result.value);
                if (result.value) {
                    setProvider(result.value.provider);
                    setEndpoint(result.value.endpoint);
                    setModel(result.value.model);
                    setPersist(result.value.persisted);
                }
            })
            .catch(() => {
                if (!active) return;
                setLoadFailed(true);
                setError("연결 정보를 불러오지 못했습니다. Discord를 다시 시작해 주십시오.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    function markEdited() {
        setNotice("");
        setError("");
        setConfirmDelete(false);
    }

    const dirty = saved
        ? provider !== saved.provider ||
          endpoint.trim() !== saved.endpoint ||
          model.trim() !== saved.model ||
          persist !== saved.persisted ||
          Boolean(apiKey)
        : Boolean(endpoint.trim() || model.trim() || apiKey || persist || provider !== "openai");
    const busy = loading || saving || deleting;
    const canSave = !busy && dirty && Boolean(endpoint.trim() && model.trim());
    const keepsKey = saved?.hasApiKey && saved.provider === provider && saved.endpoint === endpoint.trim();
    const connectionStatus = loading
        ? "연결 정보 확인 중"
        : loadFailed
          ? "연결 확인 실패"
          : saved
            ? saved.persisted
                ? "이 기기에 저장됨"
                : "세션에 저장됨"
            : "연결 정보 없음";

    async function save() {
        if (!canSave) return;
        setSaving(true);
        setError("");
        setNotice("");
        setConfirmDelete(false);
        const input = { provider, endpoint: endpoint.trim(), model: model.trim(), apiKey, persist };
        setApiKey("");
        try {
            const result = await Native.saveConnection(input);
            if (!result.ok) {
                setError(result.error.detail);
                return;
            }
            setSaved(result.value);
            setProvider(result.value.provider);
            setEndpoint(result.value.endpoint);
            setModel(result.value.model);
            setPersist(result.value.persisted);
            setLoadFailed(false);
            setNotice(
                result.value.persisted
                    ? "연결 정보를 이 기기에 암호화하여 저장했습니다."
                    : "연결 정보를 적용했습니다. Discord를 종료하면 삭제됩니다.",
            );
        } catch {
            setError("연결 정보를 저장하지 못했습니다. 다시 시도해 주십시오.");
        } finally {
            setSaving(false);
        }
    }

    async function clear() {
        if (busy || !confirmDelete) return;
        setDeleting(true);
        setError("");
        setNotice("");
        setApiKey("");
        try {
            const result = await Native.clearConnection();
            if (!result.ok) {
                setError(result.error.detail);
                return;
            }
            setSaved(null);
            setProvider("openai");
            setEndpoint("");
            setModel("");
            setPersist(false);
            setLoadFailed(false);
            setConfirmDelete(false);
            setNotice("연결 정보를 삭제했습니다.");
        } catch {
            setError("연결 정보를 삭제하지 못했습니다. 다시 시도해 주십시오.");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="llm-translate llm-settings">
            <LanguageSettings />
            <section className="llm-settings-section" aria-labelledby={`${id}-connection-heading`} aria-busy={busy}>
                <div className="llm-settings-heading">
                    <h3 id={`${id}-connection-heading`}>LLM 연결</h3>
                    <span className="llm-settings-status">{connectionStatus}</span>
                </div>
                <p className="llm-translate-help">번역할 때 원문을 아래 서버로 전송합니다.</p>
                <form
                    autoComplete="off"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void save();
                    }}
                >
                    <fieldset disabled={busy} className="llm-translate-fields">
                        <div className="llm-settings-field">
                            <label htmlFor={`${id}-provider`}>API 유형</label>
                            <select
                                id={`${id}-provider`}
                                name="provider"
                                value={provider}
                                onChange={(event) => {
                                    setProvider(event.target.value as Provider);
                                    setApiKey("");
                                    markEdited();
                                }}
                            >
                                <option value="openai">OpenAI 호환 (Chat Completions)</option>
                                <option value="anthropic">Anthropic (Messages)</option>
                                <option value="gemini">Gemini (generateContent)</option>
                            </select>
                        </div>
                        <div className="llm-settings-field">
                            <label htmlFor={`${id}-endpoint`}>최종 API 주소</label>
                            <input
                                id={`${id}-endpoint`}
                                name="endpoint"
                                type="text"
                                inputMode="url"
                                value={endpoint}
                                required
                                maxLength={2048}
                                autoComplete="off"
                                spellCheck={false}
                                aria-describedby={`${id}-endpoint-help`}
                                onChange={(event) => {
                                    setEndpoint(event.target.value);
                                    setApiKey("");
                                    markEdited();
                                }}
                            />
                            <p id={`${id}-endpoint-help`} className="llm-translate-help">
                                경로까지 입력합니다. 예: <code dir="ltr">{endpointExamples[provider]}</code>
                            </p>
                        </div>
                        <div className="llm-settings-field">
                            <label htmlFor={`${id}-model`}>모델</label>
                            <input
                                id={`${id}-model`}
                                name="model"
                                value={model}
                                required
                                maxLength={200}
                                autoComplete="off"
                                spellCheck={false}
                                onChange={(event) => {
                                    setModel(event.target.value);
                                    markEdited();
                                }}
                            />
                        </div>
                        <div className="llm-settings-field">
                            <label htmlFor={`${id}-key`}>API 키</label>
                            <input
                                id={`${id}-key`}
                                name="apiKey"
                                type="password"
                                value={apiKey}
                                maxLength={4096}
                                autoComplete="off"
                                spellCheck={false}
                                aria-describedby={`${id}-key-help`}
                                onChange={(event) => {
                                    setApiKey(event.target.value);
                                    markEdited();
                                }}
                            />
                            <p id={`${id}-key-help`} className="llm-translate-help">
                                {keepsKey
                                    ? "저장된 키가 있습니다. 비워 두면 유지합니다."
                                    : "이 연결에 사용할 키를 입력합니다. 인증이 없는 서버는 비워 둡니다."}
                            </p>
                        </div>
                        <div className="llm-settings-field">
                            <label className="llm-translate-check">
                                <input
                                    type="checkbox"
                                    name="persist"
                                    checked={persist}
                                    onChange={(event) => {
                                        setPersist(event.target.checked);
                                        markEdited();
                                    }}
                                />
                                이 기기에 암호화하여 저장
                            </label>
                            <p className="llm-translate-help">선택하지 않으면 Discord를 실행하는 동안만 사용합니다.</p>
                        </div>
                        <div className="llm-settings-save-row">
                            <div className="llm-translate-actions">
                                <Button type="submit" disabled={!canSave}>
                                    {saving ? "저장 중" : "연결 저장"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="dangerSecondary"
                                    disabled={!saved && !loadFailed}
                                    onClick={() => {
                                        setConfirmDelete(true);
                                        setNotice("");
                                    }}
                                >
                                    연결 삭제
                                </Button>
                            </div>
                            {dirty && <p className="llm-translate-help">저장하지 않은 변경 사항이 있습니다.</p>}
                        </div>
                        {confirmDelete && (
                            <div
                                className="llm-settings-confirm"
                                role="group"
                                aria-label="연결 삭제 확인"
                                onKeyDown={(event) => {
                                    if (event.key !== "Escape") return;
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setConfirmDelete(false);
                                }}
                            >
                                <p>이 연결 정보와 API 키를 삭제합니다.</p>
                                <div className="llm-translate-actions">
                                    <Button type="button" variant="dangerPrimary" onClick={() => void clear()}>
                                        {deleting ? "삭제 중" : "삭제 확인"}
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => setConfirmDelete(false)}>
                                        취소
                                    </Button>
                                </div>
                            </div>
                        )}
                    </fieldset>
                </form>
                <p role="status" className="llm-settings-notice">
                    {notice}
                </p>
                {error && <p role="alert">{error}</p>}
            </section>
        </div>
    );
}
