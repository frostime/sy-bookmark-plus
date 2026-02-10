/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-06-12 19:48:53
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2026-02-10 22:25:54
 * @Description  :
 */
import {
    Plugin,
} from "siyuan";


import { solidDialog } from "./libs/dialog";

import { configRef, getModel, rmModel, saveConfig, subViews, type BookmarkDataModel } from "./model";
import { configs } from "./model";

import Setting from './components/setting';

import { updateStyleDom, removeStyleDom } from "@/utils/style";
import { Svg } from "@/utils/const";
import { setI18n } from "@/utils/i18n";

import "@/index.scss";
import { isMobile } from "./utils";

import { loadSdk, unloadSdk } from "./sdk";

import { registerPlugin } from "@frostime/siyuan-plugin-kits";
import { enableAutoRefresh } from "./model/auto-refresh";

import { destroyAllBookmark, dockViewIconElement, dockViewTypeName, initBookmark } from "./dock-views";

let model: BookmarkDataModel;


const useSiyuanBookmark = () => {
    const bookmarkKeymap = window.siyuan.config.keymap.general.bookmark;
    const initial = bookmarkKeymap.custom || bookmarkKeymap.default;

    return {
        initial,
        replaceDefault: () => {
            // 替换默认的快捷键
            bookmarkKeymap.custom = '';

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

    async onload() {
        //@ts-ignore
        registerPlugin(this);
        setI18n(this.i18n as I18n);

        let svgs = Object.values(Svg);
        this.addIcons(svgs.join(''));

        model = getModel(this);

        await model.load();

        if (configs.replaceDefault) {
            this.replaceDefaultBookmark();
        }

        this.addDock({
            type: dockViewTypeName('DEFAULT'),
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
            }
        });

        for (let [vid, view] of Object.entries(subViews())) {
            if (view.hidden === true) continue;
            let icon = 'iconEmoji';
            if (view.icon?.type === 'symbol') {
                icon = view.icon.value;
            }
            this.addDock({
                type: dockViewTypeName(vid),
                config: {
                    position: view.dockPosition ?? 'RightBottom',
                    size: {
                        width: 200,
                        height: 200,
                    },
                    icon: icon,
                    title: view.name || 'Bookmark+'
                },
                data: {
                    plugin: this,
                    initBookmark: initBookmark,
                },
                init() {
                    //@ts-ignore
                    this.data.initBookmark(this.element, vid);
                }
            });
        }

        // useSdk(this);
        loadSdk();
        if (configRef().autoRefreshTemplatingRuleOnSwitchProtyle) {
            enableAutoRefresh();
        }
    }

    /**
     * 如果云端发生变化，影响到当前插件的 storage 存储（例如另一个设备上插件更新了数据），就会调用这个回调函数
     * 思源默认的行为是 disable 这个插件再启用，相当于会再次走插件初始化过程
     * 如果集成并重写这个方法，则会覆盖默认行为
     */
    onDataChanged(): void {
        console.debug(`[Bookmark+] onDataChanged called, reloading model`);
        model.reload();
    }

    private replaceDefaultBookmark() {
        bookmarkKeymap.replaceDefault();

        // 添加自定义的快捷键打开我们的默认视图
        this.addCommand({
            langKey: 'F-Misc::Bookmark',
            langText: 'F-misc Bookmark',
            hotkey: bookmarkKeymap.initial,
            callback: () => {
                const ele = dockViewIconElement('DEFAULT');
                ele?.click();
            }
        });
    }

    onunload(): void {
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
