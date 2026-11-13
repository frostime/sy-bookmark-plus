/*
 * Copyright (c) 2025 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2025-02-15 22:20:32
 * @FilePath     : /src/model/auto-refresh.ts
 * @LastEditTime : 2025-02-15 23:00:05
 * @Description  : 
 */

import { thisPlugin } from "@frostime/siyuan-plugin-kits";
import { configs, getModel } from ".";

/**
 * 动态组是否随文档页签切换刷新:
 * - 'off': 总是不刷新, 优先级最高, 含模板变量的组也不刷
 * - 'on': 总是刷新, 不看全局开关, 也不要求规则含文档变量
 * - 'default': 遵循全局开关, 且要求规则文本含文档模板变量
 */
export const isRefreshOnDocSwitch = (group: IBookmarkGroup): boolean => {
    const mode = group.refreshOnDocSwitch ?? 'default';
    if (mode === 'off') return false;
    if (mode === 'on') return true;
    if (!configs.autoRefreshTemplatingRuleOnSwitchProtyle) return false;
    const content = group.rule?.input ?? '';
    return content.includes('{{CurDocId}}') || content.includes('{{CurRootId}}');
}

/**
 * 随文档页签切换, 刷新命中的动态组
 */
export const refreshAllDynamicGroupOnDocSwitch = () => {

    const model = getModel();
    const groupTobeUpdate = model.getGroupsInViews().filter(group => {
        if (group.type !== 'dynamic' || !group.rule?.input) return false;
        return isRefreshOnDocSwitch(group);
    });
    if (groupTobeUpdate.length === 0) return;
    groupTobeUpdate.forEach((g: IBookmarkGroup) => {
        model.updateDynamicGroup(g).then(() => {
            model.updateGroupStaticItemsDebounced(g);
        });
    });
}


let listeningPlugin: ReturnType<typeof thisPlugin> | undefined;
export const enableAutoRefresh = () => {
    const plugin = thisPlugin();
    if (listeningPlugin === plugin) return;
    disableAutoRefresh();
    plugin.eventBus.on('switch-protyle', refreshAllDynamicGroupOnDocSwitch);
    listeningPlugin = plugin;
};

export const disableAutoRefresh = () => {
    listeningPlugin?.eventBus.off('switch-protyle', refreshAllDynamicGroupOnDocSwitch);
    listeningPlugin = undefined;
};
