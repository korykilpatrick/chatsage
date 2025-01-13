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

export class Channel {
    'channelId'?: number;
    'workspaceId'?: number | null;
    'name'?: string;
    'topic'?: string;
    'channelType'?: Channel.ChannelTypeEnum;
    'archived'?: boolean;
    'createdAt'?: Date;
    'updatedAt'?: Date;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "channelId",
            "baseName": "channelId",
            "type": "number"
        },
        {
            "name": "workspaceId",
            "baseName": "workspaceId",
            "type": "number"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "topic",
            "baseName": "topic",
            "type": "string"
        },
        {
            "name": "channelType",
            "baseName": "channelType",
            "type": "Channel.ChannelTypeEnum"
        },
        {
            "name": "archived",
            "baseName": "archived",
            "type": "boolean"
        },
        {
            "name": "createdAt",
            "baseName": "createdAt",
            "type": "Date"
        },
        {
            "name": "updatedAt",
            "baseName": "updatedAt",
            "type": "Date"
        }    ];

    static getAttributeTypeMap() {
        return Channel.attributeTypeMap;
    }
}

export namespace Channel {
    export enum ChannelTypeEnum {
        Public = <any> 'PUBLIC',
        Private = <any> 'PRIVATE',
        Dm = <any> 'DM'
    }
}
