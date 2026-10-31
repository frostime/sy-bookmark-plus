/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-07-07 14:44:03
 * @FilePath     : /src/model/stores.ts
 * @LastEditTime : 2026-02-10 22:14:32
 * @Description  :
 */
import { createStore, reconcile } from "solid-js/store";

import { batch, createMemo } from "solid-js";
import { createStoreRef, wrapStoreRef } from "@frostime/solid-signal-ref";
import { bookmarkStorage } from "./storage";

export const [itemInfo, setItemInfo] = createStore<{ [key: BlockId]: IBookmarkItemInfo }>({});

export const clearItemInfo = () => {
    const keys = Object.keys(itemInfo);
    for (const key of keys) {
        setItemInfo(key as BlockId, undefined!);
    }
};

export const [groups, setGroups] = createStore<IBookmarkGroup[]>([]);
export const groupMap = createMemo<Map<TBookmarkGroupId, IBookmarkGroup & { index: number }>>(() => {
    return new Map(groups.map((group, index) => [group.id, { ...group, index: index }]));
});



const StorageNameGroupViews = 'bookmark-sub-views';
export const subViews = createStoreRef<{ [key: TBookmarkSubViewId]: IBookmarkSubView }>({});
export const defaultView = createStoreRef<IBookmarkDefaultView>({ groups: [] });

export const readSubViews = async () => {
    return await bookmarkStorage.read(StorageNameGroupViews + '.json') as Record<TBookmarkSubViewId, IBookmarkSubView>;
};

export const replaceSubViews = (views: Record<TBookmarkSubViewId, IBookmarkSubView>) => {
    batch(() => {
        for (const id of Object.keys(subViews())) subViews.update(id, undefined!);
        subViews.update(views);
    });
};

export const saveSubViews = async () => {
    await bookmarkStorage.write(StorageNameGroupViews + '.json', subViews.unwrap());
}

interface IConfig {
    hideClosed: boolean;
    hideDeleted: boolean;
    viewMode: 'bookmark' | 'card';
    replaceDefault: boolean;
    autoRefreshOnExpand: boolean;
    ariaLabel: boolean;
    zoomInWhenClick: boolean;
    autoRefreshTemplatingRuleOnSwitchProtyle: boolean;
}

const defaultConfigs: IConfig = {
    hideClosed: true,
    hideDeleted: true,
    viewMode: 'bookmark',
    replaceDefault: true,
    autoRefreshOnExpand: false,
    ariaLabel: false,
    zoomInWhenClick: true,
    autoRefreshTemplatingRuleOnSwitchProtyle: false
};
export const [configs, setConfigs] = createStore<IConfig>({ ...defaultConfigs });
export const configRef = wrapStoreRef(configs, setConfigs);


const StorageFileConfigs = 'bookmark-configs.json';  //书签插件相关的配置
const _saveConfig = async () => {
    const data = configRef.unwrap();
    // console.debug('save config', data);
    await bookmarkStorage.write(StorageFileConfigs, data);
}
export const saveConfig = bookmarkStorage.deferSave(_saveConfig, 750);

export const readConfig = () => bookmarkStorage.read(StorageFileConfigs);
export const replaceConfig = (values: Partial<IConfig> = {}) => {
    setConfigs(reconcile({ ...defaultConfigs, ...values }));
};
