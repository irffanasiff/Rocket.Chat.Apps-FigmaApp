import {
    IPersistence,
    IPersistenceRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export class AppPersistence {
    constructor(
        private readonly persistence: IPersistence,
        private readonly persistenceRead: IPersistenceRead
    ) {}

    //! this function will connect file to room will get a teamID and roomId
    public async connectFileToRoom(teamID: string, room: IRoom): Promise<void> {
        const roomAssociation = new RocketChatAssociationRecord(
            RocketChatAssociationModel.ROOM,
            room.id
        );
        const repoAssociation = new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            `file:${teamID}`
        );

        await this.persistence.updateByAssociations(
            [roomAssociation, repoAssociation],
            {
                teamID,
                room: room.id,
            },
            true
        );
    }

    //!  accessToken and the user data will be provided to this function
    public async setUserAccessToken(
        accessToken: string,
        user: IUser
    ): Promise<void> {
        const userAssociation = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            user.id
        );
        const typeAssociation = new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            "figma-key"
        );

        /*
         * Updates an existing record with the data provided in the App's persistent storage which are associated with more than one Rocket.Chat
         * record. This will throw an error if the record doesn't currently exist or if the data is not an object.
         */

        //%  Persistence - Provides an accessor write data to the App's persistent storage.
        await this.persistence.updateByAssociations(
            [userAssociation, typeAssociation], // ! an array of association data which includes the model and record id
            { accessToken }, // ! the actual data to store, must be an object otherwise it will error out
            true
        );
    }

    //! userId will be provided and you have to return access token
    public async getUserAccessToken(user: IUser): Promise<string | undefined> {
        const userAssociation = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            user.id
        );

        const typeAssociation = new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            "figma-key"
        );

        const [result] = await this.persistenceRead.readByAssociations([
            userAssociation,
            typeAssociation,
        ]);
        return result ? (result as any).accessToken : undefined;
    }

    public async getConnectedRoomId(
        fileName: string
    ): Promise<string | undefined> {
        const repoAssociation = new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            `file:${fileName}`
        );

        const [result] = await this.persistenceRead.readByAssociations([
            repoAssociation,
        ]);

        return result ? (result as any).room : undefined;
    }
}
