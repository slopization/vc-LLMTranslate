import type { PluginNative } from "@utils/types";

import type { Result, TranslationInput } from "./types";

export const Native = VencordNative.pluginHelpers.LlmTranslate as PluginNative<typeof import("./native")>;

let activeOwner: symbol | undefined;
let activeRun: Promise<Result<string>> | undefined;
let activeCancellation: Promise<void> | undefined;

export function runTranslation(owner: symbol, input: TranslationInput): Promise<Result<string>> {
    if (activeOwner)
        return Promise.resolve({
            ok: false,
            error: {
                type: "urn:llm-translate:error:busy",
                title: "번역 진행 중",
                status: 409,
                detail: "진행 중인 번역을 마치거나 취소한 뒤 다시 시도해 주십시오.",
                instance: crypto.randomUUID(),
                extensions: { code: "busy", messageKey: "llmTranslate.busy" },
            },
        });
    activeOwner = owner;
    activeRun = (async () => {
        try {
            return await Native.translate(input);
        } finally {
            await activeCancellation?.catch(() => {});
            if (activeOwner === owner) {
                activeOwner = undefined;
                activeRun = undefined;
                activeCancellation = undefined;
            }
        }
    })();
    return activeRun;
}

export async function cancelTranslation(owner: symbol) {
    if (activeOwner !== owner) return;
    const completion = activeRun;
    if (!activeCancellation) {
        activeCancellation = Native.cancelTranslations().then(() => {});
    }
    await activeCancellation;
    await completion?.catch(() => {});
}
