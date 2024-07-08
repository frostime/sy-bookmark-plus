import { Component, For, createMemo, createSignal } from "solid-js";
import { render } from "solid-js/web";
import Group from "./group";
import { confirm, Menu, Plugin, showMessage } from "siyuan";
import { type BookmarkDataModel, configs, groups } from "../model";
import { confirmDialog, simpleDialog } from "@/libs/dialog";

import { BookmarkContext } from "./context";

import Setting from './setting';
import NewGroup from "./new-group";

import { i18n, renderI18n } from "@/utils/i18n";

interface Props {
    plugin: Plugin;
    model: BookmarkDataModel;
}

const createNewGroup = (confirmCb: (data: any) => void) => {
    let container = document.createElement("div") as HTMLDivElement;
    container.style.display = 'contents';

    const [group, setGroup] = createSignal({name: "", type: "normal"});
    const [rule, setRule] = createSignal({type: "", input: ""});

    render(() => NewGroup({
        setGroup: (args) => {
            let current = group();
            let newval = {...current, ...args};
            setGroup(newval);
        },
        setRule: (args) => {
            let current = rule();
            let newval = {...current, ...args};
            setRule(newval);
        }
    }), container);
    confirmDialog({
        title: i18n.bookmark.new,
        content: container,
        width: '600px',
        confirm: () => {
            confirmCb({group: group(), rule: rule()});
        }
    });
}

const BookmarkComponent: Component<Props> = (props) => {

    const I18N = i18n.bookmark;

    const [fnRotate, setFnRotate] = createSignal("");

    type TAction = "" | "AllExpand" | "AllCollapse";
    const [doAction, setDoAction] = createSignal<TAction>("");

    const shownGroups = createMemo(() => {
        let newg = groups.filter(group => !group.hidden);
        return newg;
    });

    const groupAdd = () => {
        createNewGroup((result: {group: any, rule: any}) => {
            console.log(result);
            let { group, rule } = result;
            if (group.name === "") {
                showMessage(i18n.msg.groupNameEmpty, 3000, 'error');
                return;
            }
            props.model.newGroup(group.name, group.type, rule);
        });
    };

    const bookmarkRefresh = () => {
        setFnRotate("fn__rotate");
        props.model.updateAll().then(() => {
            setTimeout(() => {
                setFnRotate("");
            }, 500);
        });
    };

    const groupDelete = (detail: IBookmarkGroup) => {
        confirm(
            // `是否删除书签组${detail.name}[${detail.id}]?`,
            renderI18n(i18n.bookmark.delete.title, detail.name, detail.id),
            i18n.bookmark.delete.desc,
            // "⚠️ 删除后无法恢复！确定删除吗？",
            () => {
                props.model.delGroup(detail.id)
            }
        );
    };

    const groupMove = (
        detail: {
            to: "up" | "down" | "top" | "bottom";
            group: IBookmarkGroup;
        }
    ) => {
        //BUG 由于存在 hidden group，所以这里的操作有时候会让 group 的顺序看上去没有发生变化
        const srcIdx = shownGroups().findIndex(
            (g: IBookmarkGroup) => g.id === detail.group.id
        );
        let targetIdx: number;
        if (detail.to === "up") targetIdx = srcIdx - 1;
        else if (detail.to === "down") targetIdx = srcIdx + 1;
        else if (detail.to === "top") targetIdx = 0;
        else if (detail.to === "bottom") targetIdx = shownGroups().length - 1;
        else return;
        if (targetIdx < 0 || targetIdx >= shownGroups().length) return;

        props.model.moveGroup(srcIdx, targetIdx);
    };

    const bookmarkContextMenu = (e: MouseEvent) => {
        const menu = new Menu();
        menu.addItem({
            label: i18n.bookmark.cache,
            icon: "iconDownload",
            click: () => {
                const time = new Date();
                const timeStr = `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()} ${time.getHours()}_${time.getMinutes()}_${time.getSeconds()}`;
                const name = `Cache/bookmarks-${timeStr}.json`;
                props.model.save(name);
                showMessage(`${name}`);
            },
        });
        menu.open({
            x: e.clientX,
            y: e.clientY,
        });
    };

    const Bookmark = () => (
        <section id="custom-bookmark-container" style={{
            display: 'contents',
        }}>
            <div class="block__icons custom-bookmark-icons" onContextMenu={bookmarkContextMenu}
            >
                <div class="block__logo">
                    <svg class="block__logoicon">
                        <use href="#iconBookmark"></use>
                    </svg>
                    {I18N.logo.name}
                </div>
                <span class="fn__flex-1"></span>
                <span
                    data-type="setting"
                    class="block__icon ariaLabel"
                    aria-label={I18N.logo.setting}
                    onClick={props.plugin.openSetting}
                >
                    <svg class="">
                        <use href="#iconSettings"></use>
                    </svg>
                </span>
                <span class="fn__space"></span>
                <span
                    data-type="add"
                    class="block__icon ariaLabel"
                    aria-label={I18N.logo.add}
                    onClick={groupAdd}
                >
                    <svg class="">
                        <use href="#iconAdd"></use>
                    </svg>
                </span>
                <span class="fn__space"></span>
                <span
                    data-type="refresh"
                    class="block__icon ariaLabel"
                    aria-label={I18N.logo.refresh}
                    onClick={bookmarkRefresh}
                >
                    <svg class={fnRotate()}>
                        <use href="#iconRefresh"></use>
                    </svg>
                </span>
                <span class="fn__space"></span>
                <span
                    data-type="expand"
                    class="block__icon ariaLabel"
                    aria-label={I18N.logo.expand}
                    onClick={() => {
                        setDoAction('AllExpand');
                    }}
                >
                    <svg>
                        <use href="#iconExpand"></use>
                    </svg>
                </span>
                <span class="fn__space"></span>
                <span
                    data-type="collapse"
                    class="block__icon ariaLabel"
                    aria-label={I18N.logo.collapse}
                    onClick={() => {
                        setDoAction('AllCollapse');
                    }}
                >
                    <svg>
                        <use href="#iconContract"></use>
                    </svg>
                </span>
                <span class="fn__space"></span>
                <span
                    data-type="min"
                    class="block__icon ariaLabel"
                    aria-label={I18N.logo.min}
                >
                    <svg>
                        <use href="#iconMin"></use>
                    </svg>
                </span>
            </div>
            <main class="fn__flex-1 b3-list b3-list--background custom-bookmark-body"
                classList={{
                    'card-view': configs.viewMode === 'card'
                }}
            >
                <For each={shownGroups()}>
                    {(group) => (
                        <Group
                            group={group}
                            // ref={(el) => (groupComponent()[i] = el)}
                            groupDelete={groupDelete}
                            groupMove={groupMove}
                        />
                    )}
                </For>
            </main>
        </section>
    );

    return (<BookmarkContext.Provider value={{ plugin: props.plugin, model: props.model, shownGroups, doAction }}>
        <Bookmark />
    </BookmarkContext.Provider>);
};

export default BookmarkComponent;
