import {
    IModify,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUIKitModalViewParam } from "@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder";

export async function openModalView({
    id = "",
    question,
    persistence,
    data,
    modify,
    options = 2,
}: {
    id?: string;
    question?: string;
    persistence: IPersistence;
    data;
    modify: IModify;
    options?: number;
    }): Promise<IUIKitModalViewParam> {

    const viewId = id;

    const block = modify.getCreator().getBlockBuilder();
    block
        .addInputBlock({
            blockId: "poll",
            element: block.newPlainTextInputElement({
                initialValue: "What is your Name",
                actionId: "question",
            }),
            label: block.newPlainTextObject("What is your Name"),
        })
        .addDividerBlock();

    block.addActionsBlock({
        blockId: "config",
        elements: [
            block.newStaticSelectElement({
                placeholder: block.newPlainTextObject("Multiple choices"),
                actionId: "mode",
                initialValue: "multiple",
                options: [
                    {
                        text: block.newPlainTextObject("Multiple choices"),
                        value: "multiple",
                    },
                    {
                        text: block.newPlainTextObject("Single choice"),
                        value: "single",
                    },
                ],
            }),
            block.newButtonElement({
                actionId: "addChoice",
                text: block.newPlainTextObject("Add a choice"),
                value: String(options + 1),
            }),
            block.newStaticSelectElement({
                placeholder: block.newPlainTextObject("Open vote"),
                actionId: "visibility",
                initialValue: "open",
                options: [
                    {
                        text: block.newPlainTextObject("Open vote"),
                        value: "open",
                    },
                    {
                        text: block.newPlainTextObject("Confidential vote"),
                        value: "confidential",
                    },
                ],
            }),
        ],
    });

    return {
        id: viewId,
        title: block.newPlainTextObject("Create a poll"),
        submit: block.newButtonElement({
            text: block.newPlainTextObject("Create"),
        }),
        close: block.newButtonElement({
            text: block.newPlainTextObject("Dismiss"),
        }),
        blocks: block.getBlocks(),
    };
}
