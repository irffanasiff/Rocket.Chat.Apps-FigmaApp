import {
    IHttp,
    IMessageBuilder,
    IModify,
    IModifyCreator,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit";

export async function initiatorMessage({
    data,
    read,
    persistence,
    modify,
    http,
}: {
    data;
    read: IRead;
    persistence: IPersistence;
    modify: IModify;
    http: IHttp;
}) {
    //create a message
    const greetBuilder = await modify
        .getCreator()
        .startMessage()
        .setRoom(data.room)
        .setText(`Hey _${data.sender.username}_ !`);

    if (data.room.type !== "l") {
        await modify
            .getNotifier()
            .notifyUser(data.sender, greetBuilder.getMessage());
    } else {
        await modify.getCreator().finish(greetBuilder);
    }

    const builder = await modify.getCreator().startMessage().setRoom(data.room);

    const block = modify.getCreator().getBlockBuilder();

    block.addSectionBlock({
        text: block.newPlainTextObject("Choose below"),
    });
    block.addActionsBlock({
        blockId: "figmadata",
        elements: [
            block.newButtonElement({
                actionId: "thumbnail", //action fire when figma data select
                text: block.newPlainTextObject("Get Thumbnail"),
                value: "thumbnail",
                style: ButtonStyle.PRIMARY,
            }),
            block.newButtonElement({
                actionId: "comments", //action fire when figma data select
                text: block.newPlainTextObject("Comments"),
                value: "comments",
                style: ButtonStyle.DANGER,
            }),
        ],
    });

    builder.setBlocks(block);

    await modify.getNotifier().notifyUser(data.sender, builder.getMessage());
}
