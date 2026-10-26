import { GithubButton } from "@components/settings/tabs/plugins/PluginModalButtons";
import { ReactDOM, useCallback, useState } from "@webpack/common";

export const PLUGIN_REPOSITORY_URL = "https://github.com/slopization/vc-LLMTranslate";

function labelRepositoryLink(element: HTMLDivElement | null) {
    element?.querySelector("a")?.setAttribute("aria-label", "GitHub 저장소");
}

export function RepositoryLink() {
    const [header, setHeader] = useState<HTMLElement | null>();
    const attach = useCallback((element: HTMLSpanElement | null) => {
        if (!element) return;
        const modal = element.closest('[role="dialog"], [role="alertdialog"]');
        setHeader(modal?.querySelector<HTMLElement>(".vc-plugin-modal-header") ?? null);
    }, []);
    const link = (
        <div ref={labelRepositoryLink} className="vc-settings-modal-links">
            <GithubButton text="GitHub 저장소" href={PLUGIN_REPOSITORY_URL} />
        </div>
    );

    return (
        <>
            <span ref={attach} hidden />
            {header
                ? ReactDOM.createPortal(link, header)
                : header === null && <div className="llm-repository-fallback">{link}</div>}
        </>
    );
}
