/**
 * Chat Sage API
 * Slack-like messaging platform with universal soft-deletes, selective partitioning, email-based verification, triggers for updatedAt, real-time features, error code enumeration, and recommended monorepo structure.
 *
 * The version of the OpenAPI document: v1.0.1
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { RequestFile } from './models';

export class ErrorResponseDetails {
    'code'?: ErrorResponseDetails.CodeEnum;
    'message'?: string;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "code",
            "baseName": "code",
            "type": "ErrorResponseDetails.CodeEnum"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        }    ];

    static getAttributeTypeMap() {
        return ErrorResponseDetails.attributeTypeMap;
    }
}

export namespace ErrorResponseDetails {
    export enum CodeEnum {
        UserNotFound = <any> 'USER_NOT_FOUND',
        WorkspaceNotFound = <any> 'WORKSPACE_NOT_FOUND',
        ChannelNotFound = <any> 'CHANNEL_NOT_FOUND',
        MessageNotFound = <any> 'MESSAGE_NOT_FOUND',
        EmojiNotFound = <any> 'EMOJI_NOT_FOUND',
        InvalidCredentials = <any> 'INVALID_CREDENTIALS',
        Unauthorized = <any> 'UNAUTHORIZED',
        DuplicateReaction = <any> 'DUPLICATE_REACTION',
        Forbidden = <any> 'FORBIDDEN'
    }
}
