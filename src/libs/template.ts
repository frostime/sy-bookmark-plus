import { getActiveDoc } from "@/utils";

type TVarName = string;
type TVars = Record<TVarName, () => string | null>;


const DefaultVars: TVars = {
    'yyyy': () => new Date().getFullYear().toString(),
    'mm': () => (new Date().getMonth() + 1).toString().padStart(2, '0'),
    'dd': () => new Date().getDate().toString().padStart(2, '0'),
    'docid': () => getActiveDoc(),
}

/**
 * 将所有模板变量替换为实际的值
 * 模板变量使用 {{\s*(...)\s*}} 包裹
 * 默认模板变量:
 *  - yyyy: 当前年份
 *  - mm: 当前月份
 *  - dd: 当前日期
 *  - docid: 当前激活中的文档的 id
 * @param template 模板字符串
 * @param vars 自定义模板变量
 * @returns (string | null) 替换后的字符串; 如果有模板变量没有被正确替换, 则返回 null
 */
const renderTemplate = (template: string, vars?: TVars): string => {
    vars = vars ?? {};
    vars = { ...DefaultVars, ...vars };
    let result = template;
    for (const [varName, evaluate] of Object.entries(vars)) {
        const varReg = new RegExp(`{{\\s*${varName}\\s*}}`, 'g');
        let value = evaluate();
        if (value === null || value === undefined) return null;
        result = result.replace(varReg, value);
    }
    return result;
}

export {
    renderTemplate
};
