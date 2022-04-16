import { IMessageAttachment } from "@rocket.chat/apps-engine/definition/messages";
// the thumbnail will be sent using this file to the room
export class FileThumbnail implements IMessageAttachment {
    imageUrl?: string;

    constructor(imgUrl: string) {
        this.imageUrl = imgUrl;
    }
}