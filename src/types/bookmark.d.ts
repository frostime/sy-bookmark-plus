/*
 * Copyright (c) 2025 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-12-15 23:01:47
 * @FilePath     : /src/types/bookmark.d.ts
 * @LastEditTime : 2025-02-21 22:53:37
 * @Description  :
 */
/// <reference types="siyuan" />

type TBookmarkGroupId = string;
type TBookmarkSubViewId = string;

interface IBookmarkItem {
    id: BlockId;
    title: string;
    type: BlockType;
    box: NotebookId;
    subtype: BlockSubType | '';
}

/**
 * Bookmark item 的 svelte 组件需要的信息
 */
interface IBookmarkItemInfo extends IBookmarkItem {
    icon: string;
    ref: number;
    err?: 'BoxClosed' | 'BlockDeleted';
}

interface IItemCore {
    id: BlockId;
    style?: string;
};

type TBookmarkGroupType = 'normal' | 'dynamic' | 'composed';

type TRuleType = 'sql' | 'backlinks' | 'attr' | 'js';
interface IDynamicRule {
    type: TRuleType;
    input: string;
}

interface IBookmarkGroup {
    id: TBookmarkGroupId;
    name: string;
    expand?: boolean;
    hidden?: boolean;
    items: IItemCore[];
    type?: TBookmarkGroupType;
    rule?: IDynamicRule;
    icon?: {
        type: 'symbol' | 'emoji' | '';
        value: string;
    }
}

/**
 * 由多个 group 组成的 view
 */
interface IBookmarkSubView {
    id: TBookmarkSubViewId;
    name: string;
    hidden?: boolean; // View 本身是否需要加入到 Dock 当中
    icon?: {
        type: 'symbol' | 'emoji' | '';
        value: string;  // Dock 的 Icon
    };
    groups: TBookmarkGroupId[];  //内部包含的 Group
    expand: Record<TBookmarkGroupId, boolean>;
    dockPosition?: 'RightTop' | 'RightBottom' | 'LeftTop' | 'LeftBottom';
}

interface IBookmarkDefaultView {
    groups: TBookmarkGroupId[];
}

interface IBookmarkStorageV2 {
    schema: string;
    groups: Record<TBookmarkGroupId, IBookmarkGroup>;
    defaultView: IBookmarkDefaultView;
}


//被 drag over 悬停的 item
interface IMoveItemDetail {
    srcItem: BlockId;
    afterItem: BlockId;
    srcGroup: TBookmarkGroupId;
    targetGroup: TBookmarkGroupId;
}
