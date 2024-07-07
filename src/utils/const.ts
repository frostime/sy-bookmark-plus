/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-04-02 22:43:02
 * @FilePath     : /src/utils/const.ts
 * @LastEditTime : 2024-06-22 19:14:01
 * @Description  : 
 */

export const Svg = {
    Vertical: `<symbol id="iconVertical" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4241"><path d="M383.4 863.6V158.5c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9L76.9 387.7c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l197.2-197.2v627.9c0 17.7 14.3 32 32 32 17.6-0.1 32-14.4 32-32.1zM637.5 158.5v705.1c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9L944 634.4c6.2-6.2 9.4-14.4 9.4-22.6s-3.1-16.4-9.4-22.6c-12.5-12.5-32.8-12.5-45.3 0L701.5 786.4V158.5c0-17.7-14.3-32-32-32s-32 14.4-32 32z" p-id="4242"></path></symbol>`,
    Top: `<symbol id="iconTop" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" stroke-width="0.5"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M2.5 2.5a.75.75 0 010-1.5H13a.75.75 0 010 1.5H2.5zM2.985 9.795a.75.75 0 001.06-.03L7 6.636v7.614a.75.75 0 001.5 0V6.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 00.03 1.06z"></path> </g> </g></symbol>`
};

export const BlockTypeShort = {
    "d": "文档块",
    "h": "标题块",
    "l": "列表块",
    "i": "列表项块",
    "c": "代码块",
    "m": "数学公式块",
    "t": "表格块",
    "b": "引述块",
    "s": "超级块",
    "p": "段落块",
    "html": "HTML块",
    "query_embed": "嵌入块"
}

export const BlockType2NodeType = {
    av: 'NodeAttributeView',
    c: 'NodeCodeBlock',
    d: 'NodeDocument',
    s: 'NodeSuperBlock',
    h: 'NodeHeading',
    t: 'NodeTable',
    i: 'NodeListItem',
    p: 'NodeParagraph',
    l: 'NodeList',
    m: 'NodeMathBlock',
    b: 'NodeBlockquote',
    html: 'NodeHTMLBlock',
    query_embed: 'NodeBlockQueryEmbed'
}


export const NodeIcons = {
    NodeAttributeView: {
        icon: "iconDatabase"
    },
    NodeAudio: {
        icon: "iconRecord"
    },
    NodeBlockQueryEmbed: {
        icon: "iconSQL"
    },
    NodeBlockquote: {
        icon: "iconQuote"
    },
    NodeCodeBlock: {
        icon: "iconCode"
    },
    NodeDocument: {
        icon: "iconFile"
    },
    NodeHTMLBlock: {
        icon: "iconHTML5"
    },
    NodeHeading: {
        icon: "iconHeadings",
        subtypes: {
            h1: { icon: "iconH1" },
            h2: { icon: "iconH2" },
            h3: { icon: "iconH3" },
            h4: { icon: "iconH4" },
            h5: { icon: "iconH5" },
            h6: { icon: "iconH6" }
        }
    },
    NodeIFrame: {
        icon: "iconLanguage"
    },
    NodeList: {
        subtypes: {
            o: { icon: "iconOrderedList" },
            t: { icon: "iconCheck" },
            u: { icon: "iconList" }
        }
    },
    NodeListItem: {
        icon: "iconListItem"
    },
    NodeMathBlock: {
        icon: "iconMath"
    },
    NodeParagraph: {
        icon: "iconParagraph"
    },
    NodeSuperBlock: {
        icon: "iconSuper"
    },
    NodeTable: {
        icon: "iconTable"
    },
    NodeThematicBreak: {
        icon: "iconLine"
    },
    NodeVideo: {
        icon: "iconVideo"
    },
    NodeWidget: {
        icon: "iconBoth"
    }
};

