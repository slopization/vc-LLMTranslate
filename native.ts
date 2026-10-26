import { DATA_DIR } from "@main/utils/constants";
import { IpcMainInvokeEvent, safeStorage } from "electron";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

import { failure, TranslationEngine, validateConnection } from "./engine";
import type { Connection, PublicConnection, Result } from "./types";

const directory = join(DATA_DIR, "llmTranslate");
const file = join(directory, "connection.bin");
const engine = new TranslationEngine();
let connection: Connection | null = null;
let persisted = false;
let loaded = false;

function encryptionAvailable(): boolean {
    return (
        safeStorage.isEncryptionAvailable() &&
        (process.platform !== "linux" || safeStorage.getSelectedStorageBackend() !== "basic_text")
    );
}

function publicConnection(): PublicConnection | null {
    return connection
        ? {
              provider: connection.provider,
              endpoint: connection.endpoint,
              model: connection.model,
              hasApiKey: Boolean(connection.apiKey),
              persisted,
          }
        : null;
}

function load(): Result<null> {
    if (loaded) return { ok: true, value: null };
    try {
        if (existsSync(file)) {
            if (!encryptionAvailable())
                return failure(
                    "encryption_unavailable",
                    503,
                    "암호화 저장소 사용 불가",
                    "운영 체제의 암호화 저장소를 사용할 수 없습니다. 연결 정보를 다시 입력해 세션 동안 사용해 주십시오.",
                );
            const checked = validateConnection(JSON.parse(safeStorage.decryptString(readFileSync(file))));
            if (!checked.ok)
                return failure(
                    "stored_connection_invalid",
                    500,
                    "저장된 연결 정보 오류",
                    "저장된 연결 정보를 읽지 못했습니다. 연결 정보를 삭제한 뒤 다시 저장해 주십시오.",
                );
            connection = checked.value;
            persisted = true;
        }
        loaded = true;
        return { ok: true, value: null };
    } catch {
        return failure(
            "storage_read",
            500,
            "연결 정보 읽기 오류",
            "저장된 연결 정보를 읽지 못했습니다. 연결 정보를 삭제한 뒤 다시 저장해 주십시오.",
        );
    }
}

export async function getConnection(event: IpcMainInvokeEvent): Promise<Result<PublicConnection | null>> {
    void event;
    const result = load();
    return result.ok ? { ok: true, value: publicConnection() } : result;
}

export async function saveConnection(_: IpcMainInvokeEvent, value: unknown): Promise<Result<PublicConnection>> {
    const checked = validateConnection(value);
    if (!checked.ok) return checked;
    if (typeof value !== "object" || value === null || !("persist" in value) || typeof value.persist !== "boolean") {
        return failure("invalid_connection", 400, "연결 정보 오류", "저장 방식을 선택해 주십시오.");
    }
    const previous = load();
    if (!previous.ok && checked.value.apiKey === "") {
        return failure(
            "stored_connection_invalid",
            500,
            "저장된 연결 정보 오류",
            "연결 정보를 삭제한 뒤 다시 입력해 주십시오.",
        );
    }
    const next = checked.value;
    if (!next.apiKey && connection?.provider === next.provider && connection.endpoint === next.endpoint) {
        next.apiKey = connection.apiKey;
    }
    try {
        engine.cancel();
        if (value.persist) {
            if (!encryptionAvailable())
                return failure(
                    "encryption_unavailable",
                    503,
                    "암호화 저장소 사용 불가",
                    "운영 체제의 암호화 저장소를 사용할 수 없습니다. 세션 동안 사용을 선택해 주십시오.",
                );
            mkdirSync(directory, { recursive: true, mode: 0o700 });
            const encrypted = safeStorage.encryptString(JSON.stringify(next));
            const temporary = join(directory, `connection-${crypto.randomUUID()}.tmp`);
            try {
                writeFileSync(temporary, encrypted, { mode: 0o600, flag: "wx" });
                renameSync(temporary, file);
            } finally {
                rmSync(temporary, { force: true });
            }
        } else {
            rmSync(file, { force: true });
        }
        connection = next;
        persisted = value.persist;
        loaded = true;
        return { ok: true, value: publicConnection()! };
    } catch {
        return failure(
            "storage_write",
            500,
            "연결 정보 저장 오류",
            "연결 정보를 저장하지 못했습니다. 저장소 권한을 확인해 주십시오.",
        );
    }
}

export async function clearConnection(event: IpcMainInvokeEvent): Promise<Result<null>> {
    void event;
    try {
        engine.cancel();
        rmSync(file, { force: true });
        connection = null;
        persisted = false;
        loaded = true;
        return { ok: true, value: null };
    } catch {
        return failure(
            "storage_delete",
            500,
            "연결 정보 삭제 오류",
            "연결 정보를 삭제하지 못했습니다. 저장소 권한을 확인해 주십시오.",
        );
    }
}

export async function translate(_: IpcMainInvokeEvent, input: unknown): Promise<Result<string>> {
    const result = load();
    if (!result.ok) return result;
    if (!connection)
        return failure("not_configured", 400, "연결 정보 없음", "플러그인 설정에서 LLM 연결 정보를 입력해 주십시오.");
    return engine.translate(connection, input);
}

export async function cancelTranslations(event: IpcMainInvokeEvent): Promise<Result<null>> {
    void event;
    engine.cancel();
    return { ok: true, value: null };
}
