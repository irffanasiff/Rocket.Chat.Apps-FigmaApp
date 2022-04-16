import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { IUIKitViewSubmitIncomingInteraction } from "@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes";
import { FigmaApp } from "../FigmaApp";

import { IModalContext } from "./definations";
import { getWebhookUrl } from "./helpers/getWebhooksUrl";
import { sendNotification } from "./helpers/sendNotificaiton";
import { AppPersistence } from "./persistence";
import { FigmaSDK, getFileID, getFileName } from "./sdk";

export async function createSubscription(
    context: UIKitViewSubmitInteractionContext,
    data: IUIKitViewSubmitIncomingInteraction,
    read: IRead,
    http: IHttp,
    modify: IModify,
    persistence: IPersistence,
    app: FigmaApp,
    uid: string
) {
    const {
        view: { id },
    } = data;
    const {
        state,
    }: {
        state?: any;
    } = data.view;

    const url = state.input.url;
    const room = await read.getRoomReader().getById("GENERAL");

    const appPersistence = new AppPersistence(
        persistence,
        read.getPersistenceReader()
    );

    const token = await appPersistence.getUserAccessToken(
        context.getInteractionData().user
    );

    const fileID = getFileID(url);
    // const fileName = getFileName(url);

    const sdk = new FigmaSDK(http, token);
    // url - https://0be4-2409-4054-1c-bace-1b6c-7de9-c986-693a.ngrok.io

    try {
        await sdk.createWebhook(
            fileID,
            "https://0be4-2409-4054-1c-bace-1b6c-7de9-c986-693a.ngrok.io"
        );
    } catch (err) {
        console.error("err creating webbhook - ", err);
        await sendNotification(
            "Error subscribing to the file",
            read,
            modify,
            context.getInteractionData().user,
            room
        );
        return;
    }

    const webhookResponse = await appPersistence.connectFileToRoom(
        "1051788064684166795",
        room
    );
    console.log("webhookResponse - ", webhookResponse);

    const message = modify
        .getCreator()
        .startMessage()
        .setRoom(room)
        .setText(
            `${
                context.getInteractionData().user.name
            } subscribed to a Figma file`
        );

    return modify.getCreator().finish(message);
}
