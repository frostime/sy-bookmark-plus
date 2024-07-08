/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-06-12 19:48:53
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2024-07-08 15:05:09
 * @Description  : 
 */
import {
    Plugin,
} from "siyuan";

import { render } from "solid-js/web";

import { simpleDialog } from "./libs/dialog";

import { getModel, rmModel, type BookmarkDataModel } from "./model";
import { configs } from "./model";

import Bookmark from "./components/bookmark";
import Setting from './components/setting';

import { updateStyleDom, removeStyleDom } from "@/utils/style";
import { Svg } from "@/utils/const";
import { setI18n } from "@/utils/i18n";

import "@/index.scss";

let model: BookmarkDataModel;

const initBookmark = async (ele: HTMLElement, plugin: PluginBookmarkPlus) => {
    await model.load();
    await model.updateAll();
    ele.classList.add('fn__flex-column');
    render(() => Bookmark({
        plugin: plugin,
        model: model
    }), ele);

    if (configs.replaceDefault) {
        plugin.replaceDefaultBookmark();
    }
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
        setI18n(this.i18n);

        let svgs = Object.values(Svg);
        this.addIcons(svgs.join(''));

        model = getModel(this);

        //疑似首先 await load 会导致 addDock 无法正常执行
        // await model.load();
        // await model.updateItems();

        this.addDock({
            type: '::dock',
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
                this.data.initBookmark(this.element, this.data.plugin);
            }
        });

    }

    replaceDefaultBookmark() {
        updateStyleDom('hide-bookmark', `
        .dock span[data-type="bookmark"] {
            display: none;
        }
        `);
        bookmarkKeymap.custom = '';
        console.log('bookmarkKeymap', bookmarkKeymap);
        this.addCommand({
            langKey: 'F-Misc::Bookmark',
            langText: 'F-misc Bookmark',
            hotkey: bookmarkKeymap.default,
            callback: () => {
                const ele = document.querySelector(`span[data-type="${this.name}::dock"]`) as HTMLElement;
                ele?.click();
            }
        });
    }

    onunload(): void {
        destroyBookmark();
        bookmarkKeymap.custom = bookmarkKeymap.default;
        // this.commands = this.commands.filter((command) => command.langKey !== 'F-Misc::Bookmark');
    }

    openSetting(): void {
        let container = document.createElement("div") as HTMLDivElement;
        container.classList.add("fn__flex-1", "fn__flex");
        render(() => Setting(), container);
        simpleDialog({
            title: window.siyuan.languages.config,
            ele: container,
            width: '600px',
            height: '700px',
            callback: () => {
                model.save();
            }
        })
    }

}
