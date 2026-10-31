/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-06-12 19:48:53
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2026-02-10 22:25:54
 * @Description  :
 */
import {
    Plugin, type ICommand,
} from "siyuan";


import { solidDialog } from "./libs/dialog";

import { getModel, rmModel, saveConfig, type BookmarkDataModel } from "./model";
import { configs } from "./model";

import Setting from './components/setting';

import { updateStyleDom, removeStyleDom } from "@/utils/style";
import { Svg } from "@/utils/const";
import { setI18n } from "@/utils/i18n";

import "@/index.scss";
import { isMobile } from "./utils";

import { loadSdk, unloadSdk } from "./sdk";

import { registerPlugin } from "@frostime/siyuan-plugin-kits";
import { disableAutoRefresh, enableAutoRefresh } from "./model/auto-refresh";

import { destroyAllBookmark, disposeBookmarkContent, dockViewIconElement, registerDockViewTypeName, getDockViewTypeName, initBookmark, syncSubViewDocks } from "./dock-views";
import { StorageRefresh } from "./storage-refresh";

// SiYuan uses '' to disable a shortcut; undefined means no preference has been captured.
const DISABLED_HOTKEY = '';
const HOTKEY_NOT_CAPTURED: undefined = undefined;

let model: BookmarkDataModel;


const useSiyuanBookmark = () => {
    const bookmarkKeymap = window.siyuan.config.keymap.general.bookmark;
    const initial = bookmarkKeymap.custom || bookmarkKeymap.default;
    let replaced = false;

    return {
        initial,
        replaceDefault: () => {
            if (replaced) return;
            replaced = true;
            // 替换默认的快捷键
            bookmarkKeymap.custom = DISABLED_HOTKEY;

            updateStyleDom('hide-bookmark', `
                .dock span[data-type="bookmark"] {
                    display: none;
                }
            `);
            const min = document.querySelector('div.file-tree.sy__bookmark span[data-type="min"]') as HTMLElement;
            min?.click();
        },
        // 恢复
        restoreDefault: () => {
            if (!replaced) return;
            replaced = false;
            // 恢复默认的快捷键
            bookmarkKeymap.custom = initial;
            removeStyleDom('hide-bookmark');
        }
    }
}

export const bookmarkKeymap = useSiyuanBookmark();


export default class PluginBookmarkPlus extends Plugin {

    declare data: {
        bookmarks: {
            [key: TBookmarkGroupId]: IBookmarkGroup;
        };
    }

    //@ts-ignore
    declare readonly i18n: I18n;

    private storageRefresh?: StorageRefresh;
    private bookmarkCommand?: ICommand;
    private bookmarkHotkeyBeforeDisable: string | undefined = HOTKEY_NOT_CAPTURED;
    private unloaded = false;

    async onload() {
        //@ts-ignore
        registerPlugin(this);
        setI18n(this.i18n as I18n);

        let svgs = Object.values(Svg);
        this.addIcons(svgs.join(''));

        model = getModel(this);

        this.storageRefresh = new StorageRefresh(this, model);
        // Initial load shares the refresh/read-failure path, before Dock restoration can query data.
        await this.storageRefresh.request();
        if (this.unloaded) return;

        registerDockViewTypeName('DEFAULT', 'RightBottom');
        this.addDock({
            type: getDockViewTypeName('DEFAULT'),
            config: {
                position: 'RightBottom',
                size: {
                    width: 200,
                    height: 200,
                },
                icon: 'iconBookmark',
                title: 'Bookmark+'
            },
            data: {
                plugin: this,
                initBookmark: initBookmark,
            },
            init() {
                //@ts-ignore
                this.data.initBookmark(this.element, 'DEFAULT');
            },
            destroy() { disposeBookmarkContent('DEFAULT'); }
        });

        syncSubViewDocks(this);
        this.storageRefresh.activateDocks();
        loadSdk();
    }

    /**
     * 如果云端发生变化，影响到当前插件的 storage 存储（例如另一个设备上插件更新了数据），就会调用这个回调函数
     * 思源默认的行为是 disable 这个插件再启用，相当于会再次走插件初始化过程
     * 如果集成并重写这个方法，则会覆盖默认行为
     */
    onDataChanged(): Promise<void> {
        return this.storageRefresh?.request() ?? Promise.resolve();
    }

    applySettings() {
        if (configs.replaceDefault) {
            bookmarkKeymap.replaceDefault();
            if (!this.bookmarkCommand) {
                const command: ICommand = {
                    langKey: 'F-Misc::Bookmark',
                    langText: 'F-misc Bookmark',
                    hotkey: bookmarkKeymap.initial,
                    callback: () => dockViewIconElement('DEFAULT')?.click()
                };
                this.addCommand(command);
                this.bookmarkCommand = command;
            } else if (!this.bookmarkCommand.hotkey && !this.bookmarkCommand.customHotkey) {
                this.bookmarkCommand.hotkey = this.bookmarkHotkeyBeforeDisable ?? bookmarkKeymap.initial;
                this.bookmarkCommand.customHotkey = this.bookmarkCommand.hotkey;
            }
        } else {
            bookmarkKeymap.restoreDefault();
            if (this.bookmarkCommand?.hotkey || this.bookmarkCommand?.customHotkey) {
                this.bookmarkHotkeyBeforeDisable = this.bookmarkCommand.customHotkey ?? this.bookmarkCommand.hotkey;
                this.bookmarkCommand.hotkey = DISABLED_HOTKEY;
                this.bookmarkCommand.customHotkey = DISABLED_HOTKEY;
            }
        }
        if (configs.autoRefreshTemplatingRuleOnSwitchProtyle) enableAutoRefresh();
        else disableAutoRefresh();
    }

    onunload(): void {
        this.unloaded = true;
        this.storageRefresh?.dispose();
        unloadSdk();
        rmModel();
        destroyAllBookmark();
        bookmarkKeymap.restoreDefault();
    }

    openSetting(): void {
        let size = {
            width: '1200px',
            height: '720px',
            maxWidth: '90%',
            maxHeight: '90%',
        };
        if (isMobile()) {
            //@ts-ignore
            size = {
                width: '100%',
                height: '90%'
            }
        }
        solidDialog({
            title: window.siyuan.languages.config,
            loader: () => Setting(),
            callback: async () => {
                await saveConfig();
                await model.save();
            },
            ...size
        });
    }

}
