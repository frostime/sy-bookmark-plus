import { Component, For, createMemo, createSignal } from "solid-js";
import Group from "./group";
import { confirm, Menu, Plugin, showMessage } from "siyuan";
import { configs, defaultView, getModel, groups, subViews } from "../model";
import { moveItem } from "@/libs/op";

import { BookmarkContext } from "./context";


import { i18n, renderI18n } from "@/utils/i18n";
import { createNewGroup } from "./new-group";
import { openViewGroupDialog } from "./setting/view-group-dialog";


/**
 * Bookmark 组件
 * @param props
 * @param props.plugin
 * @param model
 * @param props.sourceView: 来源, 默认的书签组或者是自定义的书签组视图
 */
const BookmarkComponent: Component<{
    plugin: Plugin;
    // model: BookmarkDataModel;
    sourceView: 'DEFAULT' | string;
}> = (props) => {

    const I18N = i18n.bookmark;

    const model = getModel();

    const [fnRotate, setFnRotate] = createSignal("");

    type TAction = "" | "AllExpand" | "AllCollapse";
    const [doAction, setDoAction] = createSignal<TAction>("");

    const shownGroups = createMemo(() => {
        if (props.sourceView === "DEFAULT") {
            const defaultGroupIds = defaultView().groups ?? [];
            const result = [];
            for (const gid of defaultGroupIds) {
                const g = groups.find(g => g.id === gid);
                if (g) result.push(g);
            }
            return result;
        } else {
            const view = subViews()[props.sourceView];
            if (!view) return [];
            let ans = [];
            for (const gid of view.groups) {
                const g = groups.find(g => g.id === gid);
                if (g) ans.push(g);
            }
            return ans;
        }
    });

    const groupAdd = () => {
        createNewGroup((result: { group: any, rule: any, icon?: IBookmarkGroup['icon'] }) => {
            // console.log(result);
            let { group, rule, icon } = result;
            if (group.name === "") {
                showMessage(i18n.msg.groupNameEmpty, 3000, 'error');
                return;
            }
            if (props.sourceView === "DEFAULT") {
                model.newGroup(group.name, group.type, rule, icon);
            } else {
                const newGroup = model.newGroup(group.name, group.type, rule, icon, true);
                subViews.update(props.sourceView, 'groups', (gs: IBookmarkGroup['id'][]) => {
                    return [...gs, newGroup.id];
                });
            }
        });
    };

    const bookmarkRefresh = () => {
        setFnRotate("fn__rotate");
        model.updateViews(props.sourceView).then(() => {
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
                model.delGroup(detail.id)
            }
        );
    };

    const groupMove = (
        detail: {
            to: "up" | "down" | "top" | "bottom";
            group: IBookmarkGroup;
        }
    ) => {
        const groupsInView = props.sourceView === "DEFAULT"
            ? (defaultView().groups ?? [])
            : (subViews()[props.sourceView]?.groups ?? []);

        const srcIdx = groupsInView.findIndex((gid) => gid === detail.group.id);
        if (srcIdx < 0) return;

        let targetIdx: number = -1;
        if (detail.to === "up") {
            targetIdx = srcIdx - 1;
        }
        else if (detail.to === "down") targetIdx = srcIdx + 1;
        else if (detail.to === "top") targetIdx = 0;
        else if (detail.to === "bottom") targetIdx = groupsInView.length - 1;
        else return;
        if (targetIdx < 0 || targetIdx >= groupsInView.length || targetIdx === srcIdx) return;

        if (props.sourceView === "DEFAULT") {
            model.moveDefaultViewGroup(srcIdx, targetIdx);
        } else {
            subViews.update(props.sourceView, 'groups', (gs: IBookmarkGroup['id'][]) => {
                return moveItem(gs, srcIdx, targetIdx);
            });
            model.save();
        }
    };

    const bookmarkContextMenu = (e: MouseEvent) => {
        if (props.sourceView !== 'DEFAULT') return;
        const menu = new Menu();
        menu.addItem({
            label: i18n.bookmark.cache,
            icon: "iconDownload",
            click: () => {
                const time = new Date();
                const timeStr = `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()} ${time.getHours()}_${time.getMinutes()}_${time.getSeconds()}`;
                const name = `Cache/bookmarks-${timeStr}.json`;
                model.save(name);
                showMessage(`${name}`);
            },
        });
        menu.open({
            x: e.clientX,
            y: e.clientY,
        });
    };

    const viewIcon = () => {
        if (props.sourceView !== 'DEFAULT') {
            const icon = subViews()[props.sourceView]?.icon;
            if (icon?.type === 'symbol') {
                return icon.value;
            }
        }
        return 'iconBookmark';
    }

    const viewName = () => {
        return props.sourceView !== 'DEFAULT' ? subViews()[props.sourceView].name : I18N.logo.name;
    }

    const Bookmark = () => (
        <section id="custom-bookmark-container" style={{
            display: 'contents',
        }}>
            <div class="block__icons custom-bookmark-icons" onContextMenu={bookmarkContextMenu}
            >
                <div class="block__logo">
                    <svg class="block__logoicon">
                        <use href={`#${viewIcon()}`}></use>
                    </svg>
                    {viewName()}
                </div>
                <span class="fn__flex-1"></span>
                <span
                    data-type="setting"
                    class="block__icon ariaLabel"
                    aria-label={I18N.logo.setting}
                    onClick={() => {
                        openViewGroupDialog({
                            plugin: props.plugin,
                            sourceView: props.sourceView
                        });
                    }}
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
                            groupDelete={groupDelete}
                            groupMove={groupMove}
                        />
                    )}
                </For>
            </main>
        </section>
    );

    return (
        <BookmarkContext.Provider
            value={{
                plugin: props.plugin,
                model: model,
                subViewId: props.sourceView,
                shownGroups, doAction
            }}
        >
            <Bookmark />
        </BookmarkContext.Provider>
    );
};

export default BookmarkComponent;
