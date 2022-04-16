import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { initiatorMessage } from "../lib/initiatorMessage";
import { AppPersistence } from "../lib/persistence";
import { sendNotification } from "../lib/helpers/sendNotificaiton";
import { FigmaSDK, getFileID, getFileName } from "../lib/sdk";
import { getWebhookUrl } from "../lib/helpers/getWebhooksUrl";
import { FigmaApp } from "../FigmaApp";
import { TextObjectType } from "@rocket.chat/apps-engine/definition/uikit/blocks/Objects";
import { BlockElementType } from "@rocket.chat/apps-engine/definition/uikit";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

// there will be two command one to connect the file or project and other to set the figma token
enum Command {
    Help = "help",
    Subscribe = "subscribe",
    Connect = "connect",
}
// Commands
function uuid(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export class FigmaCommand implements ISlashCommand {
    public command = "figma";
    public i18nParamsExample = "params_example";
    public i18nDescription = "cmd_description";
    public providesPreview = false;

    public constructor(private readonly app: FigmaApp) {}

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persistence: IPersistence
    ): Promise<void> {
        console.log(
            "------------------------------------------------------------------------"
        );
        const sender = context.getSender(); // the user calling the slashcommand
        const room = context.getRoom(); // the current room

        const [command] = context.getArguments();
        switch (command) {
            case Command.Help:
                await this.figmaHelpCommand(
                    context,
                    read,
                    modify,
                    http,
                    persistence
                );
                break;
            case Command.Subscribe: // * subscribe to the file/project
                await this.figmaSubscribeCommand(
                    context,
                    read,
                    modify,
                    http,
                    persistence,
                    room
                );
                break;

            case Command.Connect: // * connect your figma account with rocket chat
                await this.figmaConnectCommand(
                    context,
                    read,
                    modify,
                    http,
                    persistence
                );
                break;
        }

        const data = {
            room: room,
            sender: sender,
            args: command,
        };

        //  await initiatorMessage({ data, read, persistence, modify, http });
    }
    private async figmaHelpCommand(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {}

    private async figmaSubscribeCommand(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
        room: IRoom
    ): Promise<void> {
        const persistence = new AppPersistence(
            persis,
            read.getPersistenceReader()
        );
        // verifies if the user token exist in persistence storage
        const accessToken = await persistence.getUserAccessToken(
            context.getSender()
        );

        if (!accessToken) {
            await sendNotification(
                "You access key is not configured. Please run `/figma connect YOUR_ACCESS_TOKEN`",
                read,
                modify,
                context.getSender(),
                context.getRoom()
            );
            return;
        }

        const triggerId = context.getTriggerId();
        const block = modify.getCreator().getBlockBuilder();

        block.addSectionBlock({
            text: {
                text: "Subscribe your rocket chat channel to notifications about files, teams, or projects. You can only subscribe to resources were you have edit access.",
                type: TextObjectType.PLAINTEXT,
            },
        });

        block.addDividerBlock();
        block.addSectionBlock({
            text: {
                text: "Select a resource to subscribe to",
                type: TextObjectType.PLAINTEXT,
            },
        });
        block.addActionsBlock({
            blockId: "type",
            elements: [
                block.newStaticSelectElement({
                    placeholder: block.newPlainTextObject("File"),
                    actionId: "type",
                    initialValue: "file",
                    options: [
                        {
                            text: block.newPlainTextObject("File"),
                            value: "file",
                        },
                        {
                            text: block.newPlainTextObject("Project"),
                            value: "project",
                        },
                    ],
                }),
            ],
        });
        // block.newStaticSelectElement({
        //     actionId: "mode",
        //     placeholder: {
        //         text: "Select a resource",
        //         type: TextObjectType.PLAINTEXT,
        //     },
        //     options: [
        //         {
        //             text: {
        //                 text: "File",
        //                 type: TextObjectType.PLAINTEXT,
        //             },
        //             value: "file",
        //         },
        //         {
        //             text: {
        //                 text: "Project",

        //                 type: TextObjectType.PLAINTEXT,
        //             },
        //             value: "project",
        //         },
        //         {
        //             text: {
        //                 text: "Team",
        //                 type: TextObjectType.PLAINTEXT,
        //             },
        //             value: "team",
        //         },
        //     ],
        // });

        block.addInputBlock({
            label: {
                text: "Enter the URL of the resource",
                type: TextObjectType.PLAINTEXT,
            },
            blockId: "input",
            element: {
                actionId: "url",
                placeholder: {
                    text: "Enter the Url",
                    type: TextObjectType.PLAINTEXT,
                },
                type: BlockElementType.PLAIN_TEXT_INPUT,
            },
        });

        return await modify.getUiController().openModalView(
            {
                id: "modelView",
                title: block.newPlainTextObject("Get Figma notifications"),
                close: block.newButtonElement({
                    text: block.newPlainTextObject("Cancel"),
                }),
                submit: block.newButtonElement({
                    text: block.newPlainTextObject("Submit"),
                }),
                blocks: block.getBlocks(),
            },
            { triggerId },
            context.getSender(),
            room,
        );
    }

    private async figmaConnectCommand(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        // accessToken - 359833-8d2741d7-a14f-424d-b88f-c6c6fa4f7eb9
        const [, accessToken] = context.getArguments(); // accessToken establishes a link between a user’s account and their access to a given API

        // if accessToken is missing in the command send the user that  "Usage: `/figma set-token ACCESS_TOKEN`"
        if (!accessToken) {
            await sendNotification(
                "Usage: `/figma connect YOUR_FIGMA_ACCESS_TOKEN`",
                read,
                modify,
                context.getSender(),
                context.getRoom()
            );
            return;
        }
        // AppPersistence - Provides an accessor write data to the App's persistent storage.
        const persistence = new AppPersistence(
            persis,
            read.getPersistenceReader()
            /* Retrieves a record from the App's persistent storage by the provided id.
             *  An empty array is returned should there be no records associated with the
             *  data provided.
             */
        );

        await persistence.setUserAccessToken(accessToken, context.getSender());

        await sendNotification(
            "Successfully stored your key",
            read,
            modify,
            context.getSender(),
            context.getRoom()
        );
    }
}
