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

export class AuthRefreshPostRequest {
    'refreshToken': string;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "refreshToken",
            "baseName": "refreshToken",
            "type": "string"
        }    ];

    static getAttributeTypeMap() {
        return AuthRefreshPostRequest.attributeTypeMap;
    }
}

