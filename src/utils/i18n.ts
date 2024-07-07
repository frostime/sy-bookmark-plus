/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-07-07 18:57:06
 * @FilePath     : /src/utils/i18n.ts
 * @LastEditTime : 2024-07-07 21:24:01
 * @Description  : 
 */
import type I18n from '@/../dev/i18n/zh_CN.json';

export let i18n: typeof I18n = {} as any;

export const setI18n = (_i18n_: any) => {
    i18n = new Proxy(_i18n_, {
        set: (..._) => {
            console.warn("Attempt to modify read-only i18n object");
            return true;
        }
    });
}

export const renderI18n = (template: string, ...args: any[]) => {
    return template.replace(/\{(\d+)\}/g, (_, index) => {
        const argIndex = parseInt(index, 10);
        if (argIndex < args.length) {
            return args[argIndex];
        }
        return '?';
    });
}
