/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-05-20 18:54:29
 * @FilePath     : /src/types/bookmark.d.ts
 * @LastEditTime : 2024-10-03 17:06:24
 * @Description  : 
 */
type TBookmarkGroupId = string;

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

type TRuleType = 'sql' | 'backlinks' | 'attr';
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
        type: 'symbol' | 'emoji' | ''; value: string;
    }
}


//被 drag over 悬停的 item
interface IMoveItemDetail {
    srcItem: BlockId;
    afterItem: BlockId;
    srcGroup: TBookmarkGroupId;
    targetGroup: TBookmarkGroupId;
}
