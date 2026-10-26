import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";
import { React } from "@webpack/common";

import { ConnectionSettings } from "./components/ConnectionSettings";
import { LanguageSettings } from "./components/LanguageSettings";
import { getLanguageLabel, getLanguageName, LANGUAGES, SOURCE_LANGUAGES } from "./utils/languages";
import type { TranslationInput } from "./types";

export const settings = definePluginSettings({
    sourceLanguage: {
        type: OptionType.SELECT,
        displayName: "원문 언어",
        hidden: true,
        description: "",
        componentProps: { "aria-label": "원문 언어" },
        options: SOURCE_LANGUAGES.map((language) => ({
            label: language.label,
            value: language.value,
            default: language.value === "auto",
        })),
    },
    targetLanguage: {
        type: OptionType.SELECT,
        displayName: "번역 언어",
        hidden: true,
        description: "",
        componentProps: { "aria-label": "번역 언어" },
        options: LANGUAGES.map((language) => ({
            label: language.label,
            value: language.value,
            default: language.value === "ko",
        })),
    },
    languages: {
        type: OptionType.COMPONENT,
        component: () => React.createElement(LanguageSettings),
    },
    connection: {
        type: OptionType.COMPONENT,
        component: () => React.createElement(ConnectionSettings),
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
