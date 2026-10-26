import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { getLanguageLabel, getLanguageName, LANGUAGES, SOURCE_LANGUAGES } from "./languages";
import type { TranslationInput } from "./types";

export const settings = definePluginSettings({
    sourceLanguage: {
        type: OptionType.SELECT,
        description: "원문 언어",
        hidden: true,
        options: SOURCE_LANGUAGES.map((language) => ({
            label: language.label,
            value: language.value,
            default: language.value === "auto",
        })),
    },
    targetLanguage: {
        type: OptionType.SELECT,
        description: "번역 언어",
        hidden: true,
        options: LANGUAGES.map((language) => ({
            label: language.label,
            value: language.value,
            default: language.value === "ko",
        })),
    },
});

export function getTranslationOptions() {
    const source = SOURCE_LANGUAGES.some((language) => language.value === settings.store.sourceLanguage)
        ? settings.store.sourceLanguage
        : "auto";
    const target = LANGUAGES.some((language) => language.value === settings.store.targetLanguage)
        ? settings.store.targetLanguage
        : "ko";
    return {
        sourceLanguage: getLanguageName(source),
        targetLanguage: getLanguageName(target),
        sourceLabel: getLanguageLabel(source),
        targetLabel: getLanguageLabel(target),
    };
}

export function createTranslationInput(text: string): TranslationInput {
    const { sourceLanguage, targetLanguage } = getTranslationOptions();
    return { text, sourceLanguage, targetLanguage };
}
