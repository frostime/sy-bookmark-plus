/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-07-25 21:07:36
 * @FilePath     : /src/libs/query.ts
 * @LastEditTime : 2024-07-25 21:13:38
 * @Description  : 
 */
import * as api from '@/api';

export const getBlocksByIDs = async (...ids: BlockId[]) => {
    let idList = ids.map((id) => `"${id}"`);
    let sqlCode = `select * from blocks where id in (${idList.join(",")})`;
    let data = await api.sql(sqlCode);
    return data;
}

export const fb2p = async (inputs: Block[]) => {

    let ids = (inputs as Block[]).map(b => b.id);
    let blocks: Block[] = inputs as Block[];

    let data: {[key: BlockId]: any} = await api.request('/api/block/getBlockTreeInfos', {
        ids: ids
    });
    let result: Block[] = [];
    for (let block of blocks) {
        result.push(block);
        let info = data[block.id];
        if (info.type !== 'NodeParagraph') continue;
        if (info.previousID !== '') continue;
        if (!['NodeBlockquote', 'NodeListItem'].includes(info.parentType)) continue;
        let resultp = result[result.length - 1];
        resultp.id = info.parentID;
        resultp.type = {'NodeBlockquote': 'b', 'NodeListItem': 'i'}[info.parentType];
    }
    return result;
}
