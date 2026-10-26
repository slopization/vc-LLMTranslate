import { LANGUAGE_CATALOG } from "./languageCatalog";

export interface LanguageOption {
    value: string;
    label: string;
    name: string;
    regions: readonly string[];
}

const languageNames = new Intl.DisplayNames(["ko"], {
    type: "language",
    languageDisplay: "standard",
    fallback: "none",
});
const koreanRegions = new Intl.DisplayNames(["ko"], { type: "region", fallback: "none" });
const englishRegions = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
const collator = new Intl.Collator("ko");
const preferred = ["ko", "en", "ja", "zh-CN", "zh-TW"];
const overrides: Record<string, { label: string; name: string }> = {
    "zh-CN": { label: "중국어 (간체, 중국)", name: "Chinese (Simplified, China)" },
    "zh-TW": { label: "중국어 (번체, 대만)", name: "Chinese (Traditional, Taiwan)" },
};

function normalize(value: string): string {
    return value.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
}

export const LANGUAGES: readonly LanguageOption[] = LANGUAGE_CATALOG.map(([value, name, territories]) => ({
    value,
    label: overrides[value]?.label ?? (languageNames.of(value) ?? name).replace(/\s*\(/g, " ("),
    name: overrides[value]?.name ?? name,
    regions: territories.split(" "),
})).sort((left, right) => {
    const leftIndex = preferred.indexOf(left.value);
    const rightIndex = preferred.indexOf(right.value);
    if (leftIndex >= 0 || rightIndex >= 0) {
        return (leftIndex >= 0 ? leftIndex : preferred.length) - (rightIndex >= 0 ? rightIndex : preferred.length);
    }
    return collator.compare(left.label, right.label) || left.value.localeCompare(right.value);
});

export const SOURCE_LANGUAGES: readonly LanguageOption[] = [
    { value: "auto", label: "자동 감지", name: "auto", regions: [] },
    ...LANGUAGES,
];

const byValue = new Map(SOURCE_LANGUAGES.map((language) => [language.value, language]));
const countryMatches = new Map<string, Set<string>>();

function addCountryName(name: string, region: string) {
    const key = normalize(name);
    const regions = countryMatches.get(key) ?? new Set<string>();
    regions.add(region);
    countryMatches.set(key, regions);
}

for (const region of new Set(LANGUAGES.flatMap((language) => language.regions))) {
    addCountryName(region, region);
    addCountryName(koreanRegions.of(region) ?? region, region);
    addCountryName(englishRegions.of(region) ?? region, region);
}

for (const [region, aliases] of Object.entries({
    KR: ["한국", "대한민국", "남한", "South Korea", "Korea"],
    KP: ["북한", "North Korea"],
    US: ["미국", "USA", "United States"],
    GB: ["영국", "UK", "Britain", "United Kingdom"],
})) {
    for (const alias of aliases) addCountryName(alias, region);
}

const searchText = new Map(
    SOURCE_LANGUAGES.map((language) => [
        language.value,
        normalize(
            [
                language.value,
                language.label,
                language.name,
                ...language.regions.flatMap((region) => [
                    region,
                    koreanRegions.of(region) ?? region,
                    englishRegions.of(region) ?? region,
                ]),
            ].join(" "),
        ),
    ]),
);
const normalizedValues = new Map(SOURCE_LANGUAGES.map((language) => [normalize(language.value), language.value]));

export function matchesLanguageSearch(value: unknown, query: string): boolean {
    if (typeof value !== "string") return false;
    const language = byValue.get(value);
    if (!language) return false;
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return true;
    const exactCountries = countryMatches.get(normalizedQuery);
    if (exactCountries && /^[A-Z]{2}$/.test(query.normalize("NFKC").trim())) {
        return language.regions.some((region) => exactCountries.has(region));
    }
    const exactLanguage = normalizedValues.get(normalizedQuery);
    if (exactLanguage) return language.value === exactLanguage;
    if (exactCountries) return language.regions.some((region) => exactCountries.has(region));
    return searchText.get(value)?.includes(normalizedQuery) ?? false;
}

export function getLanguageName(code: string): string {
    return byValue.get(code)?.name ?? "auto";
}

export function getLanguageLabel(code: string): string {
    return byValue.get(code)?.label ?? "자동 감지";
}
