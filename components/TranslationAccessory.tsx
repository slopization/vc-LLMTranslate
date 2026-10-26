import { TextButton } from "@components/Button";
import type { Message } from "@vencord/discord-types";
import { useEffect, useState } from "@webpack/common";

import { getTranslationOptions } from "../settings";
import { TranslateIcon } from "./TranslateIcon";
import {
    dismissMessageTranslation,
    getMessageTranslation,
    invalidateMessageTranslation,
    requestMessageTranslation,
    subscribeMessageTranslation,
} from "../utils/translations";

export function getMessageText(message: Message) {
    return message.content || message.messageSnapshots?.[0]?.message.content || "";
}

export function translateMessage(message: Message) {
    return requestMessageTranslation(message.id, getMessageText(message), getTranslationOptions());
}

export function TranslationAccessory({ message }: { message: Message }) {
    const sourceText = getMessageText(message);
    const [entry, setEntry] = useState(() => getMessageTranslation(message.id, sourceText));
    const [copyNotice, setCopyNotice] = useState("");

    useEffect(() => {
        const update = () => {
            setEntry(getMessageTranslation(message.id, sourceText));
            setCopyNotice("");
        };
        const unsubscribe = subscribeMessageTranslation(message.id, update);
        invalidateMessageTranslation(message.id, sourceText);
        update();
        return unsubscribe;
    }, [message.id, sourceText]);

    if (!entry || entry.sourceText !== sourceText) return null;

    return (
        <section className="llm-translation" aria-label="LLM 번역 결과">
            <div className="llm-translation-header">
                <span className="llm-translation-label">
                    <TranslateIcon width={16} height={16} /> LLM 번역
                </span>
                <span className="llm-translation-note">
                    {entry.sourceLabel} / {entry.targetLabel}
                </span>
            </div>
            {entry.status === "loading" && <p role="status">번역 중입니다.</p>}
            {entry.status === "complete" && <div className="llm-translation-text">{entry.text}</div>}
            {entry.status === "error" && <p role="alert">{entry.error}</p>}
            <div className="llm-translation-actions">
                <span className="llm-translation-note">본인에게만 표시</span>
                {entry.status !== "loading" && (
                    <TextButton variant="secondary" onClick={() => void translateMessage(message)}>
                        다시 번역
                    </TextButton>
                )}
                {entry.status === "complete" && (
                    <TextButton
                        variant="secondary"
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(entry.text);
                                setCopyNotice("복사했습니다.");
                            } catch {
                                setCopyNotice("복사하지 못했습니다. 번역문을 선택하여 복사해 주십시오.");
                            }
                        }}
                    >
                        복사
                    </TextButton>
                )}
                <TextButton variant="secondary" onClick={() => dismissMessageTranslation(message.id)}>
                    숨기기
                </TextButton>
            </div>
            {copyNotice && <p role="status">{copyNotice}</p>}
        </section>
    );
}
