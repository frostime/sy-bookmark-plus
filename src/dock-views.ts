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
    _observers: {} as Record<TBookmarkSubViewId, MutationObserver>,
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
        // Stop observing DOM changes
        if (disposers._observers[vid]) {
            disposers._observers[vid].disconnect();
            delete disposers._observers[vid];
        }

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

/**
 * Get dock view icon element with improved selector resilience
 * Tries multiple selector strategies to find the element
 * 
 * Fixes: DOM selector instability when other plugins modify the structure
 */
export const dockViewIconElement = (vid: TBookmarkSubViewId | 'DEFAULT') => {
    const plugin = thisPlugin();
    const typeName = getDockViewTypeName(vid);
    
    // Primary selector: exact match
    const primarySelector = `span[data-type="${plugin.name}${typeName}"]`;
    let element = document.querySelector(primarySelector) as HTMLElement;
    
    if (element) {
        return element;
    }

    // Fallback 1: Look for any bookmark icon with plugin name
    const fallback1Selector = `.dock span[data-type*="${plugin.name}"][data-type*="${vid}"]`;
    element = document.querySelector(fallback1Selector) as HTMLElement;
    
    if (element) {
        console.warn(`[Bookmark+] Primary selector failed for view ${vid}, using fallback selector`);
        return element;
    }

    // Fallback 2: Search in dock panel by title attribute
    const dockPanel = document.querySelector('.dock');
    if (dockPanel) {
        const allIcons = dockPanel.querySelectorAll('span[data-type*="Bookmark"]');
        for (const icon of allIcons) {
            if (icon.getAttribute('aria-label')?.includes(vid) || 
                icon.closest('[data-type*="Bookmark"]')) {
                console.warn(`[Bookmark+] Using fallback selector for view ${vid}`);
                return icon as HTMLElement;
            }
        }
    }

    console.warn(`[Bookmark+] Could not find dock icon for view: ${vid}`);
    console.debug(`[Bookmark+] Tried selectors: [${primarySelector}], [${fallback1Selector}]`);
    
    return null;
}

/**
 * Setup DOM monitoring to detect if view element is removed by other plugins
 * 
 * Fixes: Bookmark icons disappearing when other plugins modify the DOM
 */
const setupDOMMonitoring = (sourceView: string, ele: HTMLElement) => {
    const observer = new MutationObserver((mutations) => {
        try {
            // Check if element is still connected to DOM
            if (!ele.isConnected) {
                console.warn(`[Bookmark+] View ${sourceView} was removed from DOM`);
                // Attempt recovery through lazy update
                lazyUpdateModel.update().catch(err => {
                    console.error(`[Bookmark+] Failed to recover view ${sourceView}:`, err);
                });
                return;
            }

            // Check if element was hidden by other plugins
            if (ele.classList.contains('fn__none') || ele.style.display === 'none') {
                console.warn(`[Bookmark+] View ${sourceView} is hidden, attempting to show`);
                ele.classList.remove('fn__none');
                ele.style.display = '';
            }

            // Check if Dock icon is still visible
            const iconBtn = dockViewIconElement(sourceView as TBookmarkSubViewId);
            if (iconBtn && !iconBtn.isConnected) {
                console.warn(`[Bookmark+] Dock icon for view ${sourceView} was removed`);
                // The dock system should handle this, but log for debugging
            }
        } catch (error) {
            console.error(`[Bookmark+] Error in DOM monitoring for view ${sourceView}:`, error);
        }
    });

    // Monitor the element itself and its parent container
    const observeOptions: MutationObserverInit = {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'data-type'],
    };

    observer.observe(ele, observeOptions);

    // Also monitor parent container for structural changes
    const parentContainer = ele.closest('[data-type="wnd"]')?.parentElement;
    if (parentContainer) {
        observer.observe(parentContainer, observeOptions);
    }

    return observer;
};

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
 * Initialize bookmark view with improved error handling, async/await, and DOM monitoring
 * 
 * Fixes:
 * - Issue #66: Bookmark icons disappearing
 * - Issue #67: Plugin failing to load at startup
 * 
 * Improvements:
 * - Added try-catch error handling (Plan 1)
 * - Added DOM monitoring and recovery (Plan 2)
 * - Added selector fallback resilience (Plan 3)
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

        // Setup DOM monitoring to detect removal/hiding by other plugins
        const observer = setupDOMMonitoring(sourceView, ele);
        disposers._observers[sourceView ?? 'DEFAULT'] = observer;

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
