/*
 * Copyright (c) 2023 by Yp Z (frostime). All Rights Reserved.
 * @Author       : Yp Z
 * @Date         : 2023-07-29 15:17:15
 * @FilePath     : /src/model/rules.ts
 * @LastEditTime : 2024-08-26 13:18:55
 * @Description  : 
 */
import * as api from "@/api";
import { fb2p, getBlocksByIDs } from "@/libs/query";

import { Caret } from "@/utils/const";
import { renderTemplate, VAR_NAMES } from "./templating";


export abstract class MatchRule implements IDynamicRule {
    type: TRuleType;
    input: any;

    protected eof: boolean = false;

    constructor(type: TRuleType) {
        this.type = type;
        this.input = null;
    }

    dump(): IDynamicRule {
        return {
            type: this.type,
            input: this.input
        }
    }

    abstract fetch(): Promise<Block[]>;

    iseof() {
        return this.eof;
    }

    reset() {
        this.eof = false;
    }

    input2Text() {
        if (this.input === null) {
            return "";
        }
        if (Array.isArray(this.input)) {
            return this.input.join("\n");
        }
        return `${this.input}`;
    }

    // abstract updateInput(input: any);

    validateInput() { return true; } // 检查输入的 this.input 的格式是否符合要
}

const matchIDFormat = (id: string) => {
    let match = id.match(/^\d{14}-[a-z0-9]{7}$/);
    if (match) {
        return true;
    } else {
        return false;
    }
}


type TBacklinkProcess =  '' | 'fb2p' | 'b2doc';
export class Backlinks extends MatchRule {

    id: string;
    process: TBacklinkProcess = '';
    constructor(input: string) {
        super("backlinks");
        let parts = input.split(Caret);
        if (parts.length === 2) {
            this.id = parts[0];
            this.process = parts[1] as TBacklinkProcess;
        } else {
            this.id = parts[0];
        }
    }

    validateInput(): boolean {
        const validateID = matchIDFormat(this.id) || this.id === `{{${VAR_NAMES.CurDocId}}}` || this.id === `{{${VAR_NAMES.CurRootId}}}`;
        const validProcess = ['', 'fb2p', 'b2doc'].includes(this.process);
        return validateID && validProcess;
    }

    async fetch() {
        this.eof = true;
        let runtimeId = renderTemplate(this.id);
        if (!runtimeId) {
            return [];
        }
        const sql = `
            select blocks.* 
            from blocks 
            join refs on blocks.id = refs.block_id 
            where refs.def_block_id = '${runtimeId}' 
            order by blocks.updated desc 
            limit 999;
        `;
        let blocks: Block[] = await api.sql(sql);
        if (blocks.length == 0) {
            return blocks;
        }
        if (this.process === '') {
            return blocks;
        }
        else if (this.process === 'b2doc') {
            let docIds = blocks.map(b => b.root_id);
            docIds = Array.from(new Set(docIds));
            let docs = await getBlocksByIDs(...docIds);
            return docs;
        }
        else if (this.process === 'fb2p') {
            blocks = await fb2p(blocks);
        }
        return blocks;
    }

}

export class SQL extends MatchRule {
    constructor(sqlCode: string) {
        super("sql");
        this.updateInput(sqlCode.trim());
    }

    updateInput(sqlCode: any) {
        // 将 SQL 语句中的 \*、\[、\] 和 \S 替换为 \\*、\\[、\\] 和 \\S
        // 这样在 JavaScript 中，它们将被解析为原本期望的正则表达式
        this.input = sqlCode.replace(/\\(\*|\[|\]|\S)/g, '\\\\$1');
    }

    validateInput(): boolean {
        //是否是 SQL 语法
        let pat = /select\s+([\s\S]+?)\s+from\s+([\s\S]+?)\s*$/i;
        if (!pat.test(this.input)) {
            return false;
        }
        return true;
    }

    async fetch() {
        this.eof = true;
        let sqlCode = renderTemplate(this.input);
        if (!sqlCode) {
            return [];
        }
        let result = await api.sql(sqlCode);
        return result ?? [];
    }
}


class Attr extends MatchRule {

    _input: string;
    private attrname: string = '';
    private attrop: string = '=';
    private attrval: string = '';

    constructor(input: string) {
        super("attr");
        this._input = input.trim();
    }

    /**
     * 检查 this._input 的格式是否正确
     * @returns 
     */
    validateInput(): boolean {
        const inputPattern = /^([\-\w\%\{\}]+)(?:\s*(=|like)\s*(.+))?$/;
        let ok = inputPattern.test(this._input);
        if (!ok) return false;
        const matches = this._input.match(inputPattern);

        if (matches) {
            this.attrname = matches[1];
            if (matches[2]) {
                this.attrop = matches[2];
            }
            if (matches[3]) {
                this.attrval = matches[3];
            }
        }
        return true;
    }

    async fetch() {
        let name = renderTemplate(this.attrname);
        let value = this.attrval ? renderTemplate(this.attrval) : '';
        // if (!name || !value) return [];
        let query = `
        SELECT B.*
        FROM blocks AS B
        WHERE B.id IN (
            SELECT A.block_id
            FROM attributes AS A
            WHERE A.name like '${name}'
            ${value ? `AND A.value ${this.attrop} '${value}'` : ''}
        );`;
        let result = await api.sql(query);
        return result ?? [];
    }
}


export const getRule = (dynamicRule: IDynamicRule): MatchRule => {
    const maps = {
        'sql': SQL,
        'backlinks': Backlinks,
        'attr': Attr
    };
    const Rule = maps[dynamicRule.type];
    if (!Rule) return null;
    let RuleObj = new Rule(dynamicRule.input);
    return RuleObj
}

