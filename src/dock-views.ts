/*
 * Copyright (c) 2025 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2025-02-22 00:35:14
 * @FilePath     : /src/dock-views.ts
 * @LastEditTime : 2026-02-10 23:51:14
 * @Description  :
 */
import { render } from "solid-js/web";

import { isMobile, thisPlugin } from "@frostime/siyuan-plugin-kits";

import Bookmark from "./components/bookmark";
import { getModel } from "./model";

export const disposers = {
    _ele: {} as Record<TBookmarkSubViewId, HTMLElement>,
    _disposer: {} as Record<TBookmarkSubViewId, (() => void)>,
    add: (vid: TBookmarkSubViewId, fn: () => void, element: HTMLElement) => {
        if (!disposers._disposer[vid]) {
            disposers._disposer[vid] = fn;
        } else {
            console.warn(`[Bookmark+] SubView ${vid} already exists`);
        }
        if (element) {
            disposers._ele[vid] = element;
        }
    },
    disposeAll: () => {
        for (let [vid, fn] of Object.entries(disposers._disposer)) {
            disposers.dispose(vid as TBookmarkSubViewId);
        }
    },
    dispose: (vid: TBookmarkSubViewId, actions?: {
        hideIcon?: boolean;
        deleteIcon?: boolean;
        deleteDockElement?: boolean;
    }) => {
        if (disposers._disposer[vid]) {
            disposers._disposer[vid]();
            delete disposers._disposer[vid];
        }

        const iconBtn = dockViewIconElement(vid);
        if (iconBtn && iconBtn.classList.contains('dock__item--active')) {
            iconBtn.click();
            if (actions?.hideIcon) {
                iconBtn.classList.add('fn__none');
            }
            if (actions?.deleteIcon) {
                iconBtn.remove();
            }
        }


        if (actions?.deleteDockElement && disposers._ele[vid]) {
            const ele = disposers._ele[vid];
            const container = ele?.closest('[data-type="wnd"]')?.closest('.fn__flex-1.fn__flex:not([data-type="wnd"])')
            container?.classList.toggle('fn__none', true);
            delete disposers._ele[vid];
        }
    }
};

// Map 存储 vid 与 typename
const dockViewTypeMap = new Map<TBookmarkSubViewId | 'DEFAULT', string>();

/**
 * 注册并生成 dock view 的 type name（包含 position 信息）
 */
export const registerDockViewTypeName = (vid: TBookmarkSubViewId | 'DEFAULT', position: string): void => {
    const typeName = `::sub-view::${position}::${vid}`;
    dockViewTypeMap.set(vid, typeName);
}

/**
 * 获取已注册的 dock view 的 type name
 */
export const getDockViewTypeName = (vid: TBookmarkSubViewId | 'DEFAULT'): string => {
    return dockViewTypeMap.get(vid) ?? `::sub-view::${vid}`;
}

export const dockViewIconElement = (vid: TBookmarkSubViewId | 'DEFAULT') => {
    const plugin = thisPlugin();
    const selector = `span[data-type="${plugin.name}${getDockViewTypeName(vid)}"]`;
    const element = document.querySelector(selector) as HTMLElement;
    
    if (!element) {
        console.warn(`[Bookmark+] Could not find dock icon for view: ${vid}`);
    }
    
    return element;
}

const lazyUpdateModel = {
    _hasUpdate: false,
    update: async () => {
        if (lazyUpdateModel._hasUpdate === false) {
            lazyUpdateModel._hasUpdate = true;
            const model = getModel();
            await model.updateViews();
        }
    }
}

/**
 * Initialize bookmark view with improved error handling and async/await
 * 
 * Fixes:
 * - Issue #66: Bookmark icons disappearing
 * - Issue #67: Plugin failing to load at startup
 * 
 * Improvements:
 * - Added try-catch error handling
 * - Properly awaiting lazyUpdateModel.update()
 * - Added validation for element and render result
 * - Added console debugging
 */
export const initBookmark = async (ele: HTMLElement, sourceView: string) => {
    try {
        // Validate element exists
        if (!ele) {
            console.error(`[Bookmark+] Element is null for view: ${sourceView}`);
            return;
        }

        ele.classList.add('fn__flex-column');

        if (isMobile()) {
            //Refer to https://github.com/frostime/sy-bookmark-plus/issues/13#issuecomment-2283031563
            let empty = ele.querySelector('.b3-list--empty') as HTMLElement;
            if (empty) empty.style.display = 'none';
        }

        // Attempt to render component with error handling
        let dispose: (() => void) | null = null;
        try {
            dispose = render(() => Bookmark({
                //@ts-ignore
                plugin: thisPlugin(),
                sourceView: sourceView ?? 'DEFAULT'
            }), ele);
        } catch (renderError) {
            console.error(`[Bookmark+] Failed to render component for view ${sourceView}:`, renderError);
            throw renderError;
        }

        // Validate render was successful
        if (!dispose || typeof dispose !== 'function') {
            console.error(`[Bookmark+] Render returned invalid dispose function for view: ${sourceView}`);
            return;
        }

        // Register the dispose function
        disposers.add(sourceView ?? 'DEFAULT', dispose, ele);

        // Properly await the lazy update to ensure completion
        // This prevents race conditions where other plugins might interfere
        await lazyUpdateModel.update();

        console.debug(`[Bookmark+] Successfully initialized view: ${sourceView}`);
    } catch (error) {
        console.error(`[Bookmark+] Error initializing bookmark view (${sourceView}):`, error);
        // Log additional diagnostic information
        if (error instanceof Error) {
            console.error(`[Bookmark+] Error details: ${error.message}\nStack: ${error.stack}`);
        }
        // Don't rethrow - allow other views to continue loading
    }
};

export const destroyBookmark = (...params: Parameters<typeof disposers.dispose>) => {
    // rmModel();
    disposers.dispose(...params);
};

export const destroyAllBookmark = () => {
    const viewIds = Object.keys(disposers._disposer);
    for (let vid of viewIds) {
        destroyBookmark(vid as TBookmarkGroupId);
    }
}
