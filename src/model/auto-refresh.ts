/*
 * Copyright (c) 2025 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2025-02-15 22:20:32
 * @FilePath     : /src/model/auto-refresh.ts
 * @LastEditTime : 2025-02-15 23:00:05
 * @Description  : 
 */

// import { thisPlugin } from "@frostime/siyuan-plugin-kits"
import { thisPlugin } from "@frostime/siyuan-plugin-kits";
import { getModel, groups } from ".";

/**
 * 带活动文档id变量的 sql 随文档页签切换刷新
 */
export const refreshAllDynamicGroupWithDocTemplate = () => {

    const groupTobeUpdate = groups.filter((g: IBookmarkGroup) => {
        if (g.hidden === true) return false;
        if (g.type !== 'dynamic' || !g.rule?.input) return false;
        const content = g.rule.input as string;
        return content.includes('{{CurDocId}}') || content.includes('{{CurRootId}}');
    });
    if (groupTobeUpdate.length === 0) return;
    const model = getModel();
    groupTobeUpdate.forEach((g: IBookmarkGroup) => {
        model.updateDynamicGroup(g).then(() => {
            model.updateGroupStaticItemsDebounced(g);
        });
    });
}


let disposer = () => { };
export const enableAutoRefresh = () => {
    const plugin = thisPlugin();

    disposer = plugin.registerEventbusHandler('switch-protyle', () => {
        refreshAllDynamicGroupWithDocTemplate();
    });
}

export const disableAutoRefresh = () => {
    disposer();
    disposer = () => { };
}
