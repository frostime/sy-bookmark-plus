/*
 * Copyright (c) 2025 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2025-02-22 00:35:14
 * @FilePath     : /src/dock-views.ts
 * @LastEditTime : 2026-02-10 23:51:14
 * @Description  :
 */
import { render } from "solid-js/web";
import { Constants } from 'siyuan';
import { isMobile, thisPlugin } from '@frostime/siyuan-plugin-kits';
import Bookmark from './components/bookmark';
import { getModel, subViews } from './model';
import { i18n } from './utils/i18n';
import type PluginBookmarkPlus from './index';

type ViewId = TBookmarkSubViewId | 'DEFAULT';
const contents = new Map<ViewId, { content: HTMLElement; status: HTMLElement }>();
let statusMessage = '';
let retryStorage: (() => void) | undefined;

export const disposers = {
    _ele: {} as Record<ViewId, HTMLElement>,
    _disposer: {} as Record<ViewId, () => void>,
    add: (vid: ViewId, fn: () => void, element: HTMLElement) => {
        disposers._disposer[vid] = fn;
        disposers._ele[vid] = element;
    },
    disposeAll: () => {
        for (const vid of Object.keys(disposers._disposer)) disposers.dispose(vid);
    },
    dispose: (vid: ViewId, actions?: {
        hideIcon?: boolean;
        deleteIcon?: boolean;
        deleteDockElement?: boolean;
    }) => {
        const element = disposers._ele[vid];
        disposeBookmarkContent(vid);
        const button = dockViewIconElement(vid);
        if (button?.classList.contains('dock__item--active')) button.click();
        if (actions?.hideIcon) button?.classList.add('fn__none');
        if (actions?.deleteIcon) button?.remove();
        if (actions?.deleteDockElement && element) {
            const container = element.closest('[data-type="wnd"]')?.closest('.fn__flex-1.fn__flex:not([data-type="wnd"])');
            container?.classList.add('fn__none');
        }
    }
};

/** Host destroy callbacks release content only; they must not toggle the Dock. */
export const disposeBookmarkContent = (vid: ViewId) => {
    disposers._disposer[vid]?.();
    delete disposers._disposer[vid];
    delete disposers._ele[vid];
    const nodes = contents.get(vid);
    nodes?.content.remove();
    nodes?.status.remove();
    contents.delete(vid);
};

const dockViewTypeMap = new Map<ViewId, string>();
export const registerDockViewTypeName = (vid: ViewId, position: string): void => {
    if (dockViewTypeMap.has(vid)) return;
    const plugin = thisPlugin();
    const layout = window.siyuan.config.uiLayout;
    const layoutTypes = [layout?.left, layout?.right, layout?.bottom]
        .flatMap(dock => dock?.data?.flat() ?? []).map(tab => tab.type);
    const cache = window.siyuan.storage?.[Constants.LOCAL_PLUGIN_DOCKS]?.[plugin.name] ?? {};
    const saved = [...layoutTypes, ...Object.keys(cache)].find(type =>
        type.startsWith(`${plugin.name}::sub-view::`) && type.endsWith(`::${vid}`));
    // Host identity contains position: reuse this device's identity, not the remote default.
    dockViewTypeMap.set(vid, saved?.slice(plugin.name.length) ?? `::sub-view::${position}::${vid}`);
};
export const getDockViewTypeName = (vid: ViewId): string => dockViewTypeMap.get(vid) ?? `::sub-view::${vid}`;
export const dockViewIconElement = (vid: ViewId) => {
    return document.querySelector(`span[data-type="${thisPlugin().name}${getDockViewTypeName(vid)}"]`) as HTMLElement;
};

const removeSubViewDock = (plugin: PluginBookmarkPlus, vid: ViewId) => {
    const type = getDockViewTypeName(vid);
    const fullType = plugin.name + type;
    destroyBookmark(vid);
    if (typeof plugin.removeDock === 'function') {
        plugin.removeDock(plugin.docks[fullType].id ?? type);
    } else {
        // 3.8.0 has no removeDock. Mirror the host's plugin-unload cleanup.
        const host = window.siyuan as any;
        for (const dock of [host.layout?.leftDock, host.layout?.rightDock, host.layout?.bottomDock]) {
            if (dock?.data[fullType]) dock.remove(fullType);
        }
        const mobileDock = host.mobile?.docks[fullType];
        mobileDock?.destroy?.();
        if (mobileDock) {
            // The old mobile menu also retains this object and skips identical types.
            mobileDock.type = '';
            delete host.mobile.docks[fullType];
        }
        dockViewIconElement(vid)?.remove();
    }
    delete plugin.docks[fullType];
};

export const syncSubViewDocks = (plugin: PluginBookmarkPlus) => {
    const views = subViews();
    for (const [vid, type] of dockViewTypeMap) {
        if (vid !== 'DEFAULT' && plugin.docks[plugin.name + type] && (!views[vid] || views[vid].hidden)) {
            removeSubViewDock(plugin, vid);
        }
    }
    for (const [vid, view] of Object.entries(views)) {
        if (view.hidden) continue;
        registerDockViewTypeName(vid, view.dockPosition ?? 'RightBottom');
        const type = getDockViewTypeName(vid);
        const title = view.name || 'Bookmark+';
        const icon = view.icon?.type === 'symbol' ? view.icon.value : 'iconEmoji';
        if (!plugin.docks[plugin.name + type]) {
            plugin.addDock({
                type,
                config: { position: view.dockPosition ?? 'RightBottom', size: { width: 200, height: 200 }, icon, title },
                data: { plugin, initBookmark },
                init() { this.data.initBookmark(this.element, vid); },
                destroy() { disposeBookmarkContent(vid); }
            });
        }
        const dock = plugin.docks[plugin.name + type];
        if (!dock) continue; // addDock is legitimately a no-op in the settings window.
        dock.config.title = title;
        dock.config.icon = icon;
        const button = dockViewIconElement(vid);
        button?.setAttribute('data-title', title);
        button?.setAttribute('aria-label', title);
        button?.querySelector('use')?.setAttribute('href', `#${icon}`);
    }
};

const lazyUpdateModel = {
    _hasUpdate: false,
    update: () => {
        if (!lazyUpdateModel._hasUpdate) {
            void updateBookmarkViews().catch(error => console.error('[Bookmark+] query failed', error));
        }
    }
};
export const updateBookmarkViews = () => {
    if (contents.size === 0) return Promise.resolve();
    lazyUpdateModel._hasUpdate = true;
    return getModel().updateViews();
};

/** Freeze content at its owner, not by adding synchronization guards to components. */
export const setBookmarkStatus = (message = '', retry?: () => void) => {
    statusMessage = message;
    retryStorage = retry;
    for (const { content, status } of contents.values()) {
        content.inert = !!message;
        status.replaceChildren();
        status.hidden = !message;
        if (!message) continue;
        const text = document.createElement('div');
        text.textContent = message;
        status.appendChild(text);
        if (retry) {
            const button = document.createElement('button');
            button.className = 'b3-button';
            button.textContent = i18n.sync.retry;
            button.addEventListener('click', retry);
            status.appendChild(button);
        }
    }
    return contents.size > 0;
};

export const initBookmark = (ele: HTMLElement, sourceView: string) => {
    const vid = sourceView ?? 'DEFAULT';
    disposeBookmarkContent(vid);
    ele.classList.add('fn__flex-column');
    if (isMobile()) {
        const empty = ele.querySelector('.b3-list--empty') as HTMLElement;
        if (empty) empty.style.display = 'none';
    }
    const status = document.createElement('div');
    status.className = 'b3-list--empty';
    status.setAttribute('role', 'status');
    const content = document.createElement('div');
    content.style.display = 'contents';
    ele.append(status, content);
    contents.set(vid, { status, content });
    const dispose = render(() => Bookmark({ plugin: thisPlugin(), sourceView: vid }), content);
    disposers.add(vid, dispose, ele);
    setBookmarkStatus(statusMessage, retryStorage);
    if (!statusMessage) lazyUpdateModel.update();
};

/** Recreate local component state (including one-shot actions) after a storage replacement. */
export const rebuildBookmarkViews = (apply: () => void): void => {
    const mounted = Object.entries(disposers._ele);
    for (const [vid] of mounted) disposeBookmarkContent(vid);
    apply();
    // The refresh caller starts exactly one metadata update after committing.
    if (mounted.length) lazyUpdateModel._hasUpdate = true;
    for (const [vid, element] of mounted) {
        if (vid === 'DEFAULT' || (subViews()[vid] && !subViews()[vid].hidden)) initBookmark(element, vid);
    }
};

export const destroyBookmark = (...params: Parameters<typeof disposers.dispose>) => disposers.dispose(...params);
export const destroyAllBookmark = () => disposers.disposeAll();
