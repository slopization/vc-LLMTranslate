import "./styles.css";

import { ChatBarButton, type ChatBarButtonFactory } from "@api/ChatButtons";
import { findGroupChildrenByChildId, type NavContextMenuPatchCallback } from "@api/ContextMenu";
import { insertTextIntoChatInputBox } from "@utils/discord";
import definePlugin from "@utils/types";
import type { Message } from "@vencord/discord-types";
import { closeModal, DraftStore, DraftType, Menu, Modal, openModal, SelectedChannelStore } from "@webpack/common";

import { Native } from "./bridge";
import { ConnectionSettings } from "./ConnectionSettings";
import { settings } from "./settings";
import { getMessageText, translateMessage, TranslationAccessory } from "./TranslationAccessory";
import { TranslateIcon } from "./TranslateIcon";
import { clearMessageTranslations, dismissMessageTranslation } from "./translations";
import { Translator } from "./Translator";

const modalKey = "llm-translate-modal";

function showTranslator(text: string, onApply?: (translation: string) => boolean) {
    openModal(
        (props) => (
            <Modal {...props} title="LLM 번역" size="md">
                <Translator initialText={text} onApply={onApply} />
            </Modal>
        ),
        { modalKey },
    );
}

const messageMenu: NavContextMenuPatchCallback = (children, { message }: { message: Message }) => {
    const text = getMessageText(message);
    if (!text.trim()) return;
    const group = findGroupChildrenByChildId("copy-text", children);
    if (!group) return;
    group.push(
        <Menu.MenuItem
            id="llm-translate-message"
            label="LLM 번역"
            icon={TranslateIcon}
            action={() => void translateMessage(message)}
        />,
    );
};

const TranslateButton: ChatBarButtonFactory = ({ isMainChat, channel, disabled }) => {
    if (!isMainChat || disabled) return null;
    return (
        <ChatBarButton
            tooltip="LLM 번역"
            onClick={() => {
                const draft = DraftStore.getDraft(channel.id, DraftType.ChannelMessage) || "";
                showTranslator(
                    draft,
                    draft
                        ? undefined
                        : (translation) => {
                              if (
                                  SelectedChannelStore.getChannelId() !== channel.id ||
                                  DraftStore.getDraft(channel.id, DraftType.ChannelMessage)
                              )
                                  return false;
                              insertTextIntoChatInputBox(translation);
                              return true;
                          },
                );
            }}
            buttonProps={{ "aria-haspopup": "dialog" }}
        >
            <TranslateIcon />
        </ChatBarButton>
    );
};

export default definePlugin({
    name: "LlmTranslate",
    description: "사용자가 지정한 LLM 서버로 메시지와 작성할 글을 번역합니다.",
    authors: [{ name: "slopization", id: 0n }],
    tags: ["Chat", "Utility", "Privacy"],
    settings,
    settingsAboutComponent: ConnectionSettings,
    contextMenus: { message: messageMenu },
    chatBarButton: { icon: TranslateIcon, render: TranslateButton },
    renderMessageAccessory: (props) => <TranslationAccessory message={props.message} />,
    messagePopoverButton: {
        icon: TranslateIcon,
        render(message: Message) {
            const text = getMessageText(message);
            if (!text.trim()) return null;
            return { label: "LLM 번역", icon: TranslateIcon, onClick: () => void translateMessage(message) };
        },
    },
    flux: {
        MESSAGE_DELETE({ id }) {
            dismissMessageTranslation(id);
        },
        MESSAGE_DELETE_BULK({ ids }: { ids: string[] }) {
            for (const id of ids) dismissMessageTranslation(id);
        },
    },
    stop() {
        clearMessageTranslations();
        closeModal(modalKey);
        void Native.cancelTranslations().catch(() => {});
    },
});
