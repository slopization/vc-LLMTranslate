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

export type MessageText = {
    content: string;
    embeds?: readonly EmbedText[];
    messageSnapshots?: readonly { message: { content: string; embeds?: readonly EmbedText[] } }[];
};

const TEXT_EMBEDS = new Set(["rich", "auto_moderation_message"]);

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

export function getMessageText(message: MessageText) {
    const snapshot = message.messageSnapshots?.[0]?.message;
    const embeds = message.embeds?.length ? message.embeds : (snapshot?.embeds ?? []);
    return [message.content || snapshot?.content, ...embeds.map(getEmbedText)].filter(Boolean).join("\n\n");
}
