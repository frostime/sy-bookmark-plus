/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-06-12 19:48:53
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2024-06-22 21:18:25
 * @Description  : 
 */
import {
    Plugin,
    Dialog,
    Constants
} from "siyuan";
import "@/index.scss";

import { render } from 'solid-js/web';
import Hello from './hello';
import SettingExample from "@/setting-example";

import type {} from "solid-styled-jsx";


export default class PluginSample extends Plugin {


    async onload() {
        this.addTopBar({
            icon: 'iconEmoji',
            title: 'Test Solidjs',
            callback: () => {
                this.showHelloDialog();
            }
        })
    }

    showHelloDialog() {
        let dialog = new Dialog({
            title: `SiYuan ${Constants.SIYUAN_VERSION}`,
            content: `<div id="helloPanel" class="b3-dialog__content"></div>`,
            width: "720px"
        });
        render(() => Hello({app: this.app}), dialog.element.querySelector("#helloPanel"));
    }

    openSetting(): void {
        let dialog = new Dialog({
            title: "SettingPannel",
            content: `<div id="SettingPanel" style="height: 100%;"></div>`,
            width: "800px",
            height: "600px"
        });
        render(() => SettingExample({}), dialog.element.querySelector("#SettingPanel"))
    }
}
