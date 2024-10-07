/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-06-12 19:48:53
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2024-10-03 14:55:24
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
import { isMobile } from "./utils";
import { provide, purge } from "./libs/inject";

let model: BookmarkDataModel;

const initBookmark = async (ele: HTMLElement, plugin: PluginBookmarkPlus) => {
    ele.classList.add('fn__flex-column');

    if (isMobile()) {
        //Refer to https://github.com/frostime/sy-bookmark-plus/issues/13#issuecomment-2283031563
        let empty = ele.querySelector('.b3-list--empty') as HTMLElement;
        if (empty) empty.style.display = 'none';
    }
    render(() => Bookmark({
        plugin: plugin,
        model: model
    }), ele);
    await model.updateAll();
};

const destroyBookmark = () => {
    rmModel();
    model = null;
    const ele = document.querySelector('span[data-type="sy-bookmark-plus::dock"]') as HTMLElement;
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
        setI18n(this.i18n as I18n);
        provide<I18n>('i18n', this.i18n as I18n);
        provide<PluginBookmarkPlus>('plugin', this);

        let svgs = Object.values(Svg);
        this.addIcons(svgs.join(''));

        model = getModel(this);

        await model.load();

        if (configs.replaceDefault) {
            this.replaceDefaultBookmark();
        }

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
        purge();
        destroyBookmark();
        bookmarkKeymap.custom = bookmarkKeymap.default;
        // this.commands = this.commands.filter((command) => command.langKey !== 'F-Misc::Bookmark');
    }

    openSetting(): void {
        let container = document.createElement("div") as HTMLDivElement;
        container.classList.add("fn__flex-1", "fn__flex");
        render(() => Setting(), container);
        let size = {
            width: '700px',
            height: '700px'
        }
        if (isMobile()) {
            size = {
                width: '100%',
                height: '90%'
            }
        }
        simpleDialog({
            title: window.siyuan.languages.config,
            ele: container,
            callback: () => {
                model.save();
            },
            ...size
        })
    }

}
