import { getActiveDoc } from "@/utils";

/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-08-26 11:32:09
 * @FilePath     : /src/model/templating.ts
 * @LastEditTime : 2024-08-26 12:14:45
 * @Description  : 允许规则中插入一些变量；参考 https://github.com/frostime/sy-bookmark-plus/issues/14
 */
export const VAR_NAMES = {
    CurDocId: 'CurDocId',
    CurRootId: 'CurRootId',
    Year: 'yyyy',
    Month: 'MM',
    Day: 'dd',
    ShortYear: 'yy',
    Today: 'today'
}

const AllowedVars = Object.values(VAR_NAMES);

/**
 * 判断输入的字符串是否是合法的变量，格式为 {{varName}}; varName 为 VAR_NAMES 中的值
 * @param str 
 * @returns 
 */
export const isVar = (str: string) => {
    return str.startsWith('{{') && str.endsWith('}}') && AllowedVars.includes(str.slice(2, -2));
}


const renderString = (template: string, data: { [key: string]: string }) => {
    //{{var name}}
    for (const varName of AllowedVars) {
        const regex = new RegExp(`{{${varName}}}`, 'g');
        template = template.replace(regex, data[varName]);
    }
    return template;
}

const DOC_VARS = [VAR_NAMES.CurDocId, VAR_NAMES.CurRootId];

const usesDocVar = (template: string) =>
    DOC_VARS.some(name => template.includes(`{{${name}}}`));

/**
 * 动态渲染模板字符串
 *
 * 页面刚加载、还没打开任何文档时无法解析当前文档变量，此时返回 null 让调用方
 * 跳过这次查询，避免把 `undefined` 当成文档 id 拼进 SQL。
 */
export const renderTemplate = (text: string): string | null => {
    let docId = getActiveDoc();
    if (!docId && usesDocVar(text)) {
        return null;
    }
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let day = now.getDate();
    let data = {
        'CurDocId': docId,
        'CurRootId': docId,

        'yyyy': year.toString(),
        'MM': month.toString().padStart(2, '0'),
        'dd': day.toString().padStart(2, '0'),
        'yy': year.toString().slice(-2),
        'today': `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`
    };
    return renderString(text, data);
}
