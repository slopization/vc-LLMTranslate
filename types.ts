export type Provider = "openai" | "anthropic" | "gemini";

export interface Connection {
    provider: Provider;
    endpoint: string;
    model: string;
    apiKey: string;
}

export interface PublicConnection {
    provider: Provider;
    endpoint: string;
    model: string;
    hasApiKey: boolean;
    persisted: boolean;
}

export interface TranslationInput {
    text: string;
    sourceLanguage?: string;
    targetLanguage: string;
}

export interface Problem {
    type: string;
    title: string;
    status: number;
    detail: string;
    instance: string;
    extensions: Record<string, unknown>;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: Problem };
