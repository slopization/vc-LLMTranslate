import { SettingsSection } from "@components/settings/tabs/plugins/components/Common";
import { useState } from "@webpack/common";

import { LANGUAGES, matchesLanguageSearch, SOURCE_LANGUAGES } from "../utils/languages";
import { settings } from "../settings";
import { NativeSearchableSelect } from "./NativeSelect";

export function LanguageSettings({ disabled = false }: { disabled?: boolean }) {
    const [id] = useState(() => crypto.randomUUID());
    const { sourceLanguage, targetLanguage } = settings.use(["sourceLanguage", "targetLanguage"]);

    return (
        <div className="llm-settings">
            <SettingsSection name="원문 언어" id={`${id}-source`} description="">
                <NativeSearchableSelect
                    aria-label="원문 언어"
                    options={SOURCE_LANGUAGES}
                    isDisabled={disabled}
                    maxVisibleItems={5}
                    closeOnSelect
                    placeholder="언어 또는 국가 검색"
                    value={sourceLanguage}
                    filter={(options, query) => options.filter((option) => matchesLanguageSearch(option.value, query))}
                    onChange={(value) => {
                        const language = SOURCE_LANGUAGES.find((option) => option.value === value);
                        if (language) settings.store.sourceLanguage = language.value;
                    }}
                />
            </SettingsSection>
            <SettingsSection name="번역 언어" id={`${id}-target`} description="">
                <NativeSearchableSelect
                    aria-label="번역 언어"
                    options={LANGUAGES}
                    isDisabled={disabled}
                    maxVisibleItems={5}
                    closeOnSelect
                    placeholder="언어 또는 국가 검색"
                    value={targetLanguage}
                    filter={(options, query) => options.filter((option) => matchesLanguageSearch(option.value, query))}
                    onChange={(value) => {
                        const language = LANGUAGES.find((option) => option.value === value);
                        if (language) settings.store.targetLanguage = language.value;
                    }}
                />
            </SettingsSection>
        </div>
    );
}
