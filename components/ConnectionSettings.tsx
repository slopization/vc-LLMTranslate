import { Button } from "@components/Button";
import { FormSwitch } from "@components/FormSwitch";
import { Paragraph } from "@components/Paragraph";
import { SettingsSection } from "@components/settings/tabs/plugins/components/Common";
import { TextInput, useEffect, useState } from "@webpack/common";

import { Native } from "../utils/bridge";
import type { Provider, PublicConnection } from "../types";
import { NativeSelect } from "./NativeSelect";
import { RepositoryLink } from "./RepositoryLink";

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
            setNotice(result.value.persisted ? "연결 정보를 저장했습니다." : "연결 정보를 적용했습니다.");
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
        <section className="llm-settings" aria-label="LLM 연결" aria-busy={busy}>
            <RepositoryLink />
            <form
                autoComplete="off"
                className="llm-settings"
                onSubmit={(event) => {
                    event.preventDefault();
                    void save();
                }}
            >
                <SettingsSection name="API 유형" id={`${id}-provider`} description="">
                    <NativeSelect
                        aria-label="API 유형"
                        options={[
                            { value: "openai", label: "OpenAI 호환 (Chat Completions)" },
                            { value: "anthropic", label: "Anthropic (Messages)" },
                            { value: "gemini", label: "Gemini (generateContent)" },
                        ]}
                        isSelected={(value) => value === provider}
                        serialize={String}
                        isDisabled={busy}
                        maxVisibleItems={5}
                        closeOnSelect
                        select={(value) => {
                            if (value !== "openai" && value !== "anthropic" && value !== "gemini") return;
                            setProvider(value);
                            setApiKey("");
                            markEdited();
                        }}
                    />
                </SettingsSection>
                <SettingsSection
                    name="최종 API 주소"
                    id={`${id}-endpoint`}
                    description={`예: ${endpointExamples[provider]}`}
                >
                    <TextInput
                        id={`${id}-endpoint`}
                        aria-label="최종 API 주소"
                        name="endpoint"
                        type="text"
                        inputMode="url"
                        value={endpoint}
                        required
                        maxLength={2048}
                        disabled={busy}
                        autoComplete="off"
                        spellCheck={false}
                        onChange={(value) => {
                            setEndpoint(value);
                            setApiKey("");
                            markEdited();
                        }}
                    />
                </SettingsSection>
                <SettingsSection name="모델" id={`${id}-model`} description="">
                    <TextInput
                        id={`${id}-model`}
                        aria-label="모델"
                        name="model"
                        value={model}
                        required
                        maxLength={200}
                        disabled={busy}
                        autoComplete="off"
                        spellCheck={false}
                        onChange={(value) => {
                            setModel(value);
                            markEdited();
                        }}
                    />
                </SettingsSection>
                <SettingsSection name={keepsKey ? "API 키 (저장됨)" : "API 키"} id={`${id}-key`} description="">
                    <TextInput
                        id={`${id}-key`}
                        aria-label="API 키"
                        name="apiKey"
                        type="password"
                        value={apiKey}
                        maxLength={4096}
                        disabled={busy}
                        autoComplete="off"
                        spellCheck={false}
                        onChange={(value) => {
                            setApiKey(value);
                            markEdited();
                        }}
                    />
                </SettingsSection>
                <FormSwitch
                    title="이 기기에 암호화하여 저장"
                    value={persist}
                    disabled={busy}
                    hideBorder
                    onChange={(value) => {
                        setPersist(value);
                        markEdited();
                    }}
                />
                <div className="llm-translate-actions">
                    <Button type="submit" disabled={!canSave}>
                        {saving ? "저장 중" : "연결 저장"}
                    </Button>
                    <Button
                        type="button"
                        variant="dangerSecondary"
                        disabled={busy || (!saved && !loadFailed)}
                        onClick={() => {
                            setConfirmDelete(true);
                            setNotice("");
                        }}
                    >
                        연결 삭제
                    </Button>
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
                        <Paragraph>이 연결 정보와 API 키를 삭제합니다.</Paragraph>
                        <div className="llm-translate-actions">
                            <Button type="button" variant="dangerPrimary" disabled={busy} onClick={() => void clear()}>
                                {deleting ? "삭제 중" : "삭제 확인"}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={busy}
                                onClick={() => setConfirmDelete(false)}
                            >
                                취소
                            </Button>
                        </div>
                    </div>
                )}
            </form>
            {notice && <Paragraph role="status">{notice}</Paragraph>}
            {error && <Paragraph role="alert">{error}</Paragraph>}
        </section>
    );
}
