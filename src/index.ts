/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-06-12 19:48:53
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2024-07-07 18:05:52
 * @Description  : 
 */
import {
    Plugin,
} from "siyuan";
import "@/index.scss";

import { render } from "solid-js/web";
import type FMiscPlugin from "@/index";
import { getModel, rmModel, BookmarkDataModel } from "./model";
import Bookmark from "./components/bookmark";
import { updateStyleDom, removeStyleDom } from "@/utils/style";

let model: BookmarkDataModel;

const initBookmark = async (ele: HTMLElement, plugin: FMiscPlugin) => {
    await model.load();
    await model.updateAll();
    ele.classList.add('fn__flex-column');
    render(() => Bookmark({
        plugin: plugin,
        model: model
    }), ele);
};

const destroyBookmark = () => {
    rmModel();
    model = null;
    const ele = document.querySelector('span[data-type="sy-f-misc::dock::Bookmark"]') as HTMLElement;
    ele?.remove();
    removeStyleDom('hide-bookmark');
};

const bookmarkKeymap = window.siyuan.config.keymap.general.bookmark;


export default class PluginBookmarkPlus extends Plugin {

    declare data: {
        bookmarks: {
            [key: TBookmarkGroupId]: IBookmarkGroup;
        };
    }

    async onload() {
        model = getModel(this);

        //疑似首先 await load 会导致 addDock 无法正常执行
        // await model.load();
        // await model.updateItems();

        updateStyleDom('hide-bookmark', `
        .dock span[data-type="bookmark"] {
            display: none;
        }
        `);

        this.addDock({
            type: '::dock::' + 'Bookmark',
            config: {
                position: 'RightBottom',
                size: {
                    width: 200,
                    height: 200,
                },
                icon: 'iconBookmark',
                title: 'F-Bookmark'
            },
            data: {
                plugin: this,
                initBookmark: initBookmark,
            },
            init() {
                this.data.initBookmark(this.element, this.data.plugin);
            }
        });
        bookmarkKeymap.custom = '';
        console.log('bookmarkKeymap', bookmarkKeymap);
        this.addCommand({
            langKey: 'F-Misc::Bookmark',
            langText: 'F-misc 书签',
            hotkey: bookmarkKeymap.default,
            callback: () => {
                const ele = document.querySelector('span[data-type="sy-f-misc::dock::Bookmark"]') as HTMLElement;
                ele?.click();
            }
        });

    }

    onunload(): void {
        destroyBookmark();

        bookmarkKeymap.custom = bookmarkKeymap.default;
        this.commands = this.commands.filter((command) => command.langKey !== 'F-Misc::Bookmark');
    }

}
