import { cancelTranslation, runTranslation } from "./bridge";
import type { TranslationInput } from "./types";

export interface MessageTranslation {
    sourceText: string;
    sourceLabel: string;
    targetLabel: string;
    sourceLanguage: string;
    targetLanguage: string;
    owner: symbol;
    status: "loading" | "complete" | "error";
    text: string;
    error: string;
}

type TranslationOptions = Omit<TranslationInput, "text"> & { sourceLabel: string; targetLabel: string };
const entries = new Map<string, MessageTranslation>();
const listeners = new Map<string, Set<() => void>>();
const maximumEntries = 100;

function notify(messageId: string) {
    for (const listener of listeners.get(messageId) ?? []) listener();
}

export function subscribeMessageTranslation(messageId: string, listener: () => void) {
    const subscribers = listeners.get(messageId) ?? new Set();
    subscribers.add(listener);
    listeners.set(messageId, subscribers);
    return () => {
        subscribers.delete(listener);
        if (!subscribers.size) listeners.delete(messageId);
    };
}

export function getMessageTranslation(messageId: string, sourceText: string) {
    const entry = entries.get(messageId);
    return entry?.sourceText === sourceText ? entry : undefined;
}

export function dismissMessageTranslation(messageId: string) {
    const entry = entries.get(messageId);
    entries.delete(messageId);
    if (entry?.status === "loading") void cancelTranslation(entry.owner).catch(() => {});
    notify(messageId);
}

export function invalidateMessageTranslation(messageId: string, sourceText: string) {
    const entry = entries.get(messageId);
    if (entry && entry.sourceText !== sourceText) dismissMessageTranslation(messageId);
}

export function clearMessageTranslations() {
    for (const messageId of entries.keys()) dismissMessageTranslation(messageId);
}

export async function requestMessageTranslation(messageId: string, sourceText: string, options: TranslationOptions) {
    if (!sourceText.trim()) return;
    const previous = entries.get(messageId);
    if (
        previous?.status === "loading" &&
        previous.sourceText === sourceText &&
        previous.sourceLanguage === (options.sourceLanguage ?? "auto") &&
        previous.targetLanguage === options.targetLanguage
    )
        return;
    if (previous) dismissMessageTranslation(messageId);
    if (entries.size >= maximumEntries) {
        const oldestId = entries.keys().next().value;
        if (oldestId) dismissMessageTranslation(oldestId);
    }
    const entry: MessageTranslation = {
        sourceText,
        sourceLabel: options.sourceLabel,
        targetLabel: options.targetLabel,
        sourceLanguage: options.sourceLanguage ?? "auto",
        targetLanguage: options.targetLanguage,
        owner: Symbol(messageId),
        status: "loading",
        text: "",
        error: "",
    };
    entries.set(messageId, entry);
    notify(messageId);
    try {
        if (previous?.status === "loading") await cancelTranslation(previous.owner);
        if (entries.get(messageId) !== entry) return;
        const result = await runTranslation(entry.owner, {
            text: sourceText,
            sourceLanguage: entry.sourceLanguage,
            targetLanguage: entry.targetLanguage,
        });
        if (entries.get(messageId) !== entry) return;
        entries.set(
            messageId,
            result.ok
                ? { ...entry, status: "complete", text: result.value }
                : { ...entry, status: "error", error: result.error.detail },
        );
    } catch {
        if (entries.get(messageId) !== entry) return;
        entries.set(messageId, {
            ...entry,
            status: "error",
            error: "번역 요청을 처리하지 못했습니다. 연결 설정을 확인한 뒤 다시 시도해 주십시오.",
        });
    }
    notify(messageId);
}
