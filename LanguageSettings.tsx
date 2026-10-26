import { useState } from "@webpack/common";

import { LANGUAGES, SOURCE_LANGUAGES } from "./languages";
import { settings } from "./settings";

export function LanguageSettings() {
    const [id] = useState(() => crypto.randomUUID());
    const { sourceLanguage, targetLanguage } = settings.use(["sourceLanguage", "targetLanguage"]);

    return (
        <section className="llm-settings-section" aria-labelledby={`${id}-language-heading`}>
            <div className="llm-settings-heading">
                <h3 id={`${id}-language-heading`}>번역 언어</h3>
            </div>
            <div className="llm-language-fields">
                <div className="llm-settings-field">
                    <label htmlFor={`${id}-source`}>원문 언어</label>
                    <select
                        id={`${id}-source`}
                        name="sourceLanguage"
                        value={sourceLanguage}
                        onChange={(event) => {
                            settings.store.sourceLanguage = event.target.value;
                        }}
                    >
                        {SOURCE_LANGUAGES.map((language) => (
                            <option key={language.value} value={language.value}>
                                {language.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="llm-settings-field">
                    <label htmlFor={`${id}-target`}>번역 언어</label>
                    <select
                        id={`${id}-target`}
                        name="targetLanguage"
                        value={targetLanguage}
                        onChange={(event) => {
                            const language = LANGUAGES.find((option) => option.value === event.target.value);
                            if (language) settings.store.targetLanguage = language.value;
                        }}
                    >
                        {LANGUAGES.map((language) => (
                            <option key={language.value} value={language.value}>
                                {language.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <p className="llm-translate-help">언어 설정은 바로 적용됩니다.</p>
        </section>
    );
}
