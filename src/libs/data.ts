/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-06-13 14:09:40
 * @FilePath     : /src/func/bookmarks/libs/data.ts
 * @LastEditTime : 2024-06-20 15:29:04
 * @Description  : 
 */
import { sql, request } from "@/api";
import PromiseLimitPool from "@/libs/promise-pool";

export {
    getBlocks,
    type IDocInfo,
    getDocInfos
}

/**
 * 传入若干个 block id, 返回一个对象, key 为 block id, value 为 block
 * @param ids 
 * @returns 
 */
const getBlocks = async (...ids: BlockId[]) => {
    const fmt = `select * from blocks where id in (${ids.map((b) => `'${b}'`).join(',')})`;
    let blocks = await sql(fmt);
    let results: { [key: BlockId]: Block | null } = {};
    for (let id of ids) {
        let block = blocks.find(block => block.id === id);
        if (block) {
            results[id] = block;
        } else {
            results[id] = null;
        }
    }
    return results;
}

interface IDocInfo {
    rootID: DocumentId;
    rootIcon: string;
    rootTitle: string;
    box: string;
}
/**
 * 传入若干个 doc id, 返回一个对象, key 为 doc id, value 为 doc info
 * @param docIds 
 * @returns 
 */
const getDocInfos = async (...docIds: DocumentId[]) => {
    const endpoints = '/api/block/getBlockInfo';
    const pool = new PromiseLimitPool<IDocInfo>(16);
    for (let docId of docIds) {
        pool.add(async () => {
            const result = await request(endpoints, { id: docId });
            return result;
        });
    }
    let results: { [key: DocumentId]: IDocInfo | null } = {};
    try {
        let docInfos = await pool.awaitAll();
        for (let id of docIds) {
            let docInfo = docInfos.find(docInfo => docInfo?.rootID === id);
            if (docInfo) {
                results[id] = docInfo;
            }
        }
    } catch (error) {
        console.error(error);
    }
    return results;
}
