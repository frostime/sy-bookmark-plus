/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-15 23:01:47
 * @FilePath     : /src/sdk.ts
 * @LastEditTime : 2024-12-28 12:48:12
 * @Description  : 
 */
// import type PluginBookmarkPlus from ".";
import { groups, itemInfo } from "./model/stores";
// import { getModel } from "./model";

const Name = 'BookmarkPlusSDK';

export const loadSdk = () => {
    const sdk = {
        listGroups: () => {
            return groups.map(group => ({
                id: group.id,
                name: group.name,
                expand: group.expand,
                type: group.type,
            }));
        },
        findGroup: (name: string) => {
            return groups.find(group => group.name === name);
        },
        listItems: (groupId: string) => {
            if (!groupId || typeof groupId !== 'string') {
                return [];
            }
            let items = groups.find(group => group.id === groupId)?.items.slice() || [];
            items = items.filter((it) => itemInfo[it.id]?.err !== 'BoxClosed');
            items = items.filter((it) => itemInfo[it.id]?.err !== 'BlockDeleted');
            return items.map(it => it.id);
        }
    };
    // Object.assign(plugin, sdk);
    globalThis[Name] = new Proxy(sdk, {
        get: (target, prop) => {
            return target[prop as keyof typeof target];
        }
    });
}

export const unloadSdk = () => {
    if (globalThis[Name]) {
        delete globalThis[Name];
    }
}
