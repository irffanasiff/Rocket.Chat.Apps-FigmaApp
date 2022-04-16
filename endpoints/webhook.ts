import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ApiEndpoint,
    IApiEndpointInfo,
    IApiRequest,
    IApiResponse,
} from "@rocket.chat/apps-engine/definition/api";
import { AppPersistence } from "../lib/persistence";

export class WebhookEndpoint extends ApiEndpoint {
    public path =
        "https://0be4-2409-4054-1c-bace-1b6c-7de9-c986-693a.ngrok.io/v2/webhooks";
    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<IApiResponse> {
        console.log("hello world");
        const sender = await read.getUserReader().getById("");
        if (request.headers["event_type"] !== "FILE_COMMENT") {
            return this.success();
        }

        let payload: any;
        console.log("payload - ", payload);

        if (
            request.headers["content-type"] ===
            "application/x-www-form-urlencoded"
        ) {
            payload = JSON.parse(request.content.payload);
        } else {
            payload = request.content;
        }

        const persistence = new AppPersistence(
            persis,
            read.getPersistenceReader()
        );

        const roomId = await persistence.getConnectedRoomId(payload.team_id);
        console.log("room id -", roomId);

        if (!roomId) {
            return this.success();
        }

        const room = await read.getRoomReader().getById(roomId);

        if (!room) {
            return this.success();
        }

        const message = modify.getCreator().startMessage({
            room,
            sender,
            text: "successful",
        });

        modify.getCreator().finish(message);

        return this.success();
    }
}
