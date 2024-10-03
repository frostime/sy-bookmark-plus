/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-07-07 18:57:06
 * @FilePath     : /src/utils/i18n.ts
 * @LastEditTime : 2024-09-28 22:07:01
 * @Description  : 
 */

export let i18n: I18n = {} as any;

export const setI18n = (_i18n_: I18n) => {
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
