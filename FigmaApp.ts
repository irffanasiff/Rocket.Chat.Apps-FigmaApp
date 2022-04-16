import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { FigmaCommand } from "./commands/FigmaCommand";
import { WebhookEndpoint } from "./endpoints/webhook";
import {
    ApiSecurity,
    ApiVisibility,
} from "@rocket.chat/apps-engine/definition/api";
import {
    UIKitBlockInteractionContext,
    UIKitViewCloseInteractionContext,
    UIKitViewSubmitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { getWebhookUrl } from "./lib/helpers/getWebhooksUrl";
import { FigmaSDK } from "./lib/sdk";
import { sendNotification } from "./lib/helpers/sendNotificaiton";
import { createSubscription } from "./lib/createSubscriptionMessage";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

export class FigmaApp extends App {
    private readonly appLogger: ILogger;
    constructor(
        info: IAppInfo,
        logger: ILogger,
        accessors: IAppAccessors,
        private readonly app: FigmaApp
    ) {
        super(info, logger, accessors);
        this.appLogger = this.getLogger();
        this.appLogger.debug("Figma APP");
    }
    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        const data = context.getInteractionData();

        const {
            state,
        }: {
            state: {
                type: {
                    type: string;
                    [option: string]: string;
                };
                actionId: {
                    url: string;
                };
            };
        } = data.view as any;

        if (!state) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: data.view.id,
                errors: {
                    question: "Error Subscribing",
                },
            });
        }

        try {
            await createSubscription(
                context,
                data,
                read,
                http,
                modify,
                persistence,
                this.app,
                data.user.id
            );
        } catch (err) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: data.view.id,
                errors: err,
            });
        }
        return {
            success: true,
        };
    }
    public async executeViewClosedHandler(
        context: UIKitViewCloseInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        console.log("👨🏻‍💻 modal closed");
        return {
            success: true,
        };
    }
    
    // this is called whenever any block in block element in modal is interacted with
    public async executeBlockActionHandler(
        context: UIKitBlockInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ) {
        const data = context.getInteractionData();
        console.log("execute block action handler called");

        return {
            success: true,
            triggerId: data.triggerId,
        };
    }

    public async extendConfiguration(
        configuration: IConfigurationExtend,
        environmentRead: IEnvironmentRead
    ): Promise<void> {
        //Adds an api which can be called by external services
        configuration.api.provideApi({
            //  This accessor provides methods for adding a custom api.
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [new WebhookEndpoint(this)], // provides endpoint for this api registry
        });
        await configuration.slashCommands.provideSlashCommand(
            new FigmaCommand(this)
        );
    }
}
