import { IApiEndpointMetadata } from "@rocket.chat/apps-engine/definition/api";
import { FigmaApp } from "../../FigmaApp";

export async function getWebhookUrl(app: FigmaApp): Promise<string> {
    console.log("-----------here--------------");

    const webhookEndpoint = app
        .getAccessors()
        .providedApiEndpoints.find(
            (endpoint) => endpoint.path === "webhook"
        ) as IApiEndpointMetadata;
    console.log("webhookEndpoint - ", webhookEndpoint);
    const siteUrl = await app
        .getAccessors()
        .environmentReader.getServerSettings()
        .getValueById("Site_Url");
    console.log(webhookEndpoint);
    console.log(siteUrl);
    return siteUrl + webhookEndpoint.computedPath;
}
