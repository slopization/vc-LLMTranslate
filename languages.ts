export const LANGUAGES = [
    { value: "ko", label: "한국어", name: "Korean" },
    { value: "en", label: "영어", name: "English" },
    { value: "ja", label: "일본어", name: "Japanese" },
    { value: "zh-CN", label: "중국어 (간체)", name: "Simplified Chinese" },
    { value: "zh-TW", label: "중국어 (번체)", name: "Traditional Chinese" },
    { value: "de", label: "독일어", name: "German" },
    { value: "fr", label: "프랑스어", name: "French" },
    { value: "es", label: "스페인어", name: "Spanish" },
    { value: "pt", label: "포르투갈어", name: "Portuguese" },
    { value: "pt-BR", label: "포르투갈어 (브라질)", name: "Brazilian Portuguese" },
    { value: "it", label: "이탈리아어", name: "Italian" },
    { value: "ru", label: "러시아어", name: "Russian" },
    { value: "uk", label: "우크라이나어", name: "Ukrainian" },
    { value: "nl", label: "네덜란드어", name: "Dutch" },
    { value: "pl", label: "폴란드어", name: "Polish" },
    { value: "tr", label: "튀르키예어", name: "Turkish" },
    { value: "vi", label: "베트남어", name: "Vietnamese" },
    { value: "th", label: "태국어", name: "Thai" },
    { value: "id", label: "인도네시아어", name: "Indonesian" },
    { value: "ar", label: "아랍어", name: "Arabic" },
    { value: "hi", label: "힌디어", name: "Hindi" },
    { value: "sv", label: "스웨덴어", name: "Swedish" },
    { value: "fi", label: "핀란드어", name: "Finnish" },
    { value: "da", label: "덴마크어", name: "Danish" },
    { value: "no", label: "노르웨이어", name: "Norwegian" },
    { value: "cs", label: "체코어", name: "Czech" },
    { value: "ro", label: "루마니아어", name: "Romanian" },
    { value: "hu", label: "헝가리어", name: "Hungarian" },
    { value: "he", label: "히브리어", name: "Hebrew" },
    { value: "el", label: "그리스어", name: "Greek" },
] as const;

export const SOURCE_LANGUAGES = [{ value: "auto", label: "자동 감지", name: "auto" }, ...LANGUAGES];

export function getLanguageName(code: string): string {
    return SOURCE_LANGUAGES.find((language) => language.value === code)?.name ?? "auto";
}

export function getLanguageLabel(code: string): string {
    return SOURCE_LANGUAGES.find((language) => language.value === code)?.label ?? "자동 감지";
}
