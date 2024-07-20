/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-04-18 21:05:32
 * @FilePath     : /src/utils/index.ts
 * @LastEditTime : 2024-07-20 18:17:00
 * @Description  : 
 */
import * as api from '../api';


export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return function(...args: Parameters<T>) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    } as T;
}


export const getNotebook = (boxId: string): Notebook => {
    let notebooks: Notebook[] =  window.siyuan.notebooks;
    for (let notebook of notebooks) {
        if (notebook.id === boxId) {
            return notebook;
        }
    }
}

export function getActiveDoc(): DocumentId {
    let wnd = document.querySelector('div.layout__wnd--active[data-type="wnd"]');
    let container = wnd ?? document;
    const li = container.querySelector(
        "ul.layout-tab-bar>li.item--focus"
    );
    if (!li) return;
    const dataId = li.getAttribute("data-id");
    const protyle = document.querySelector(
        `div.protyle[data-id="${dataId}"] .protyle-title`
    );
    if (!protyle) return;
    const id = protyle.getAttribute("data-node-id");
    return id;
}

export function isnot(value: any) {
    if (value === undefined || value === null) {
        return true;
    } else if (value === false) {
        return true;
    } else if (typeof value === 'string' && value.trim() === '') {
        return true;
    } else if (value?.length === 0) {
        return true;
    }
    return false;
}

export async function getChildDocs(block: BlockId, limit=64) {
    let sqlCode = `select * from blocks where path regexp '.*/${block}/[0-9a-z\-]+\.sy' and type='d'
    order by hpath desc limit ${limit};`;
    let childDocs = await api.sql(sqlCode);
    return childDocs;
}


export const html2ele = (html: string): DocumentFragment => {
    let template = document.createElement('template');
    template.innerHTML = html.trim();
    let ele = document.importNode(template.content, true);
    return ele;
}

export function throttle<T extends (...args: any[]) => any>(func: T, wait: number = 500){
    let previous = 0;
    return function(...args: Parameters<T>){
        let now = Date.now(), context = this;
        if(now - previous > wait){
            func.apply(context, args);
            previous = now;
        }
    }
}
