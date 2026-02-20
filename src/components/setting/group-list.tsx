import { createMemo, For } from "solid-js";
import { groups, setGroups, itemInfo, getModel, subViews, defaultView } from "../../model";
import { moveItem } from "../../libs/op";
import { GroupIcon } from "../elements/group-icon";
import { selectGroupIcon } from "../elements/select-icon";
import { confirm, showMessage } from "siyuan";
import inputDialog from '@/libs/components/input-dialog';
import { i18n } from "@/utils/i18n";
import Icon from "../elements/icon";
import { createNewGroup } from "../new-group";

const App = () => {

    const model = getModel();
    const i18n_ = i18n.group;

    let Counts = createMemo(() => {
        let Cnt: { [key: string]: { indexed: number, closed: number, deleted: number } } = {};
        groups.forEach((group: IBookmarkGroup) => {
            let itemClosed = group.items.filter((it) => itemInfo[it.id]?.err === 'BoxClosed');
            let itemDelete = group.items.filter((it) => itemInfo[it.id]?.err === 'BlockDeleted');
            Cnt[group.id] = {
                closed: itemClosed.length,
                deleted: itemDelete.length,
                indexed: group.items.length - itemClosed.length - itemDelete.length
            }
        })
        return Cnt;
    })

    const onDragover = (e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        let srcGroupIdx: string = e.dataTransfer.getData("text/plain");
        e.dataTransfer.clearData();
        let target = (e.target as HTMLElement).closest(".bookmark-group") as HTMLElement;
        if (!target) return;
        let targetGroupIndex: string = target.dataset.index;
        let from = Number.parseInt(srcGroupIdx);
        let to = Number.parseInt(targetGroupIndex);
        if (from === to) return;

        setGroups((groups) => moveItem(groups, from, to));
        model.save();
    };

    const groupAdd = () => {
        createNewGroup((result: { group: {name: string, type?: TBookmarkGroupType }, rule: any, icon?: IBookmarkGroup['icon'] }) => {
            let { group, rule, icon } = result;
            if (group.name === "") {
                showMessage(i18n.msg.groupNameEmpty, 3000, 'error');
                return;
            }
            model.newGroup(group.name, group.type, rule, icon);
        });
    };

    const getSubviewInfos = (groupId: string): Array<{ name: string, icon?: { type: string, value: string } }> => {
        const views = subViews();
        const result: Array<{ name: string, icon?: { type: string, value: string } }> = [];

        if ((defaultView().groups ?? []).includes(groupId)) {
            result.push({
                name: "DEFAULT",
                icon: {
                    type: 'symbol',
                    value: 'iconBookmark'
                }
            });
        }

        for (const viewId in views) {
            if (views[viewId].groups.includes(groupId)) {
                result.push({
                    name: views[viewId].name,
                    icon: views[viewId].icon
                });
            }
        }
        return result;
    }

    return (
        <section
            class="fn__flex fn__flex-1 bookmark-config-group-list"
            style={{
                padding: '20px 10px',
                gap: '10px',
                display: 'flex',
                flex: 1,
                'flex-direction': 'column'
            }}
        >

            <div style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "margin-bottom": "8px",
                padding: '0px 8px'
            }}>
                <span style={{ "font-weight": "600" }}>
                    {i18n.setting.grouplist.title}
                </span>
                <div
                    onClick={(e) => { e.stopPropagation(); groupAdd() }}
                    style={{
                        cursor: "pointer",
                        padding: "4px 8px",
                        "border-radius": "4px",
                        background: "var(--b3-theme-background-light)",
                        display: "flex",
                        "align-items": "center",
                        gap: "4px"
                    }}
                >
                    <svg style={{ width: "14px", height: "14px", fill: 'currentcolor' }}><use href="#iconAdd"></use></svg>
                    <span>{i18n.bookmark.logo.add}</span>
                </div>
            </div>

            <For each={groups}>
                {(group, i) => (
                    <li
                        class="bookmark-group b3-list-item"
                        style={{
                            gap: '12px',
                            height: '40px',
                            padding: '5px 10px',
                            "border-radius": "6px",
                            background: "var(--b3-theme-surface)",
                            border: "1px solid var(--b3-theme-surface-lighter)",
                            display: "flex",
                            "align-items": "center"
                        }}
                        data-index={i()}
                        data-group-id={group.id}
                        draggable="true"
                        onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", `${i()}`);
                        }}
                        onDragOver={onDragover}
                        onDrop={onDrop}
                    >
                        <div style={{ display: "flex", "align-items": "center", gap: "8px", flex: 1 }}>
                            <span style={{ display: 'contents' }} onClick={(e: MouseEvent) => {
                                e.stopPropagation();
                                e.preventDefault();
                                selectGroupIcon({
                                    show: 'all',
                                    onReset: () => {
                                        model.setGroups(group.id, 'icon', null);
                                    },
                                    onUpdate: (icon) => {
                                        model.setGroups(group.id, 'icon', icon);
                                    }
                                })
                            }}>
                                <GroupIcon group={group} />
                            </span>
                            <span class="b3-list-item__text ariaLabel" data-position="parentE">
                                {group.name}
                            </span>
                        </div>

                        <div style={{
                            flex: 1,
                            display: "flex",
                            "justify-content": "flex-end",
                            "align-items": "center",
                            gap: "4px",
                            opacity: 0.68,
                        }}>
                            {(() => {
                                const infos = getSubviewInfos(group.id);
                                return infos.map(info => {
                                    if (info.icon?.type === 'emoji') {
                                        return <span class="ariaLabel" aria-label={info.name}>{info.icon.value}</span>;
                                    } else if (info.icon?.type === 'symbol') {
                                        return <span class="ariaLabel" aria-label={info.name}>
                                            <svg class="b3-list-item__graphic"><use href={"#" + info.icon.value}></use></svg>
                                        </span>;
                                    }
                                    return null;
                                });
                            })()}
                        </div>

                        <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                            <span class="counter ariaLabel" aria-label="Indexed" style={{ margin: 0, "background-color": "var(--b3-card-success-background)" }}>
                                {Counts()[group.id].indexed}
                            </span>
                            <span class="counter ariaLabel" aria-label="Box Closed" style={{ margin: 0, "background-color": "var(--b3-card-warning-background)" }}>
                                {Counts()[group.id].closed}
                            </span>
                            <span class="counter ariaLabel" aria-label="Not Found" style={{ margin: 0, "background-color": "var(--b3-card-error-background)" }}>
                                {Counts()[group.id].deleted}
                            </span>
                            <span class="fn__space" />

                            <span
                                onClick={() => {
                                    inputDialog({
                                        title: i18n_.rename,
                                        defaultText: group.name,
                                        width: "500px",
                                        type: 'textline',
                                        confirm: (title: string) => {
                                            if (title) {
                                                model.renameGroup(group.id, title.trim());
                                            }
                                        }
                                    });
                                }}
                                style={{ cursor: "pointer", display: 'flex' }}
                            >
                                <Icon symbol="iconEdit" />
                            </span>

                            <span
                                onClick={() => {
                                    confirm(
                                        i18n_.delete,
                                        `Remove "${group.name}"?`,
                                        () => {
                                            model.delGroup(group.id);
                                        }
                                    );
                                }}
                                style={{ cursor: "pointer", display: 'flex' }}
                            >
                                <Icon symbol="iconTrashcan" />
                            </span>
                        </div>
                    </li>
                )}
            </For>
        </section>
    );
};

export default App;
