import { IUIKitBlockIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';
import { IUser } from '@rocket.chat/apps-engine/definition/users';


export interface IModalContext extends Partial<IUIKitBlockIncomingInteraction> {
    threadId?: string;
}
