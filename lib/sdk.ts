import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";
const crypto = require("crypto");

// figma token - 359854-d17d89ef-0741-44e7-be49-b7aa40356ff0
const BaseHost = "https://www.figma.com/file/";
const BaseApiHost = "https://www.figma.com/api";
const FigmaAPIKey = "358183-e0e831c7-4a3f-4882-8d03-369014e062b6";

const passcode = crypto.randomBytes(48).toString("hex");

export class FigmaSDK {
    constructor(private readonly http: IHttp, private readonly accessToken) {}

    public createWebhook(fileID: string, webhookUrl: string) {
        return this.post("https://api.figma.com/v2/webhooks", {
            active: true,
            event_type: "FILE_COMMENT",
            team_id: "1051788064684166795",
            events: ["push"],
            endpoint: webhookUrl,
            passcode,
            content_type: "json",
        });
    }

    private async post(url: string, data: any): Promise<any> {
        const response = await this.http.post(url, {
            headers: {
                "X-Figma-Token": FigmaAPIKey,
                "Content-Type": "application/json",
                "User-Agent": "Rocket.Chat-Apps-Engine",
            },
            data,
        });

        console.log(response.statusCode);
        // If it isn't a 2xx code, something wrong happened
        if (!response.statusCode.toString().startsWith("2")) {
            throw response;
        }
        console.log("figma response - ", response);

        return JSON.parse(response.content || "{}");
    }
}
//file url example - https://www.figma.com/file/b0l0lp73g04EgbqDeNiHh4/file-2
export function getFileName(fileURL: string): string {
    if (!fileURL.startsWith(BaseHost)) {
        return "";
    }

    const apiUrl = fileURL.substring(BaseHost.length);
    const fileName = apiUrl.split("/")[1].split("?")[0];
    return fileName;
}

export function getFileID(fileURL: string): string {
    if (!fileURL.startsWith(BaseHost)) {
        return "";
    }

    const apiUrl = fileURL.substring(BaseHost.length);
    const fileID = apiUrl.split("/")[0];
    return fileID;
}
