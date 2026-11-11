type EmbedText = {
    type?: string;
    rawTitle?: string;
    title?: string;
    rawDescription?: string;
    description?: string;
    author?: { name?: string };
    footer?: { text?: string };
    fields?: readonly { rawName?: string; rawValue?: string; name?: string; value?: string }[];
};

type ComponentText = {
    type?: number;
    content?: string;
    components?: readonly ComponentText[];
};

type MessageParts = {
    content: string;
    embeds?: readonly EmbedText[];
    components?: readonly ComponentText[];
};

export type MessageText = MessageParts & {
    messageSnapshots?: readonly { message: MessageParts }[];
};

const TEXT_EMBEDS = new Set(["rich", "auto_moderation_message"]);
const TEXT_DISPLAY = 10;

function getEmbedText(embed: EmbedText) {
    if (!TEXT_EMBEDS.has(embed.type ?? "")) return "";
    return [
        embed.author?.name,
        embed.rawTitle ?? embed.title,
        embed.rawDescription ?? embed.description,
        ...(embed.fields ?? []).map((field) =>
            [field.rawName ?? field.name, field.rawValue ?? field.value].filter(Boolean).join("\n"),
        ),
        embed.footer?.text,
    ]
        .filter(Boolean)
        .join("\n\n");
}

function getComponentText(components: readonly ComponentText[] = []): string[] {
    return components.flatMap((component) => [
        ...(component.type === TEXT_DISPLAY && component.content ? [component.content] : []),
        ...getComponentText(component.components),
    ]);
}

export function getMessageText(message: MessageText) {
    const snapshot = message.messageSnapshots?.[0]?.message;
    const components = message.components?.length ? message.components : snapshot?.components;
    const embeds = message.embeds?.length ? message.embeds : (snapshot?.embeds ?? []);
    return [message.content || snapshot?.content, ...getComponentText(components), ...embeds.map(getEmbedText)]
        .filter(Boolean)
        .join("\n\n");
}
