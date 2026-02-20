import { Component, For, Show, createMemo, createSignal } from "solid-js";
import { subViews, saveSubViews, groups, defaultView } from "@/model/stores";
import { confirmDialog } from "@/libs/dialog";
import { showMessage } from "siyuan";
import { inputDialog } from "@frostime/siyuan-plugin-kits";
import { GroupIcon } from "../elements/group-icon";
import Icon from "../elements/icon";
import { selectGroupIcon } from "../elements/select-icon";
import { SelectInput } from "@/libs/components/Elements";
import { destroyBookmark } from "@/dock-views";
import { i18n } from "@/utils/i18n";
import { getModel } from "@/model";


const SubViewList: Component = () => {
    const model = getModel();
    const i18nSubview = i18n.src_components_setting_subviewlisttsx as any;
    const [editingView, setEditingView] = createSignal<string | null>(null);
    const [editingDefault, setEditingDefault] = createSignal<boolean>(false);
    const [draggingGroup, setDraggingGroup] = createSignal<string | null>(null);

    const viewList = createMemo(() => {
        let views = Object.values(subViews());
        return views;
    });

    const createNewView = () => {
        inputDialog({
            title: i18n.src_components_setting_subviewlisttsx.create_bookmark_view,
            defaultText: "",
            type: "textline",
            confirm: async (text: string) => {
                text = text.trim();
                if (!text) {
                    showMessage(i18n.src_components_setting_subviewlisttsx.enter_view_name);
                    return;
                }
                //@ts-ignore
                const viewId = window.Lute.NewNodeID();
                const newView: IBookmarkSubView = {
                    id: viewId,
                    name: text,
                    groups: [],
                    expand: {},
                    hidden: true,
                    dockPosition: 'RightBottom',
                    icon: {
                        type: 'symbol',
                        value: 'iconEmoji'
                    }
                }
                subViews.update((views) => ({ ...views, [viewId]: newView }));
                saveSubViews();
            }
        });
    };

    const deleteView = async (viewId: string) => {
        await confirmDialog({
            title: i18n.src_components_setting_subviewlisttsx.delete_bookmark_view,
            content: i18n.src_components_setting_subviewlisttsx.confirm_delete_view,
            confirm: async () => {
                if (editingView() === viewId) {
                    setEditingView(null);
                }
                destroyBookmark(viewId, {
                    deleteDockElement: true,
                    // hideIcon: true,
                    deleteIcon: true
                });
                subViews.update(viewId, undefined!);
                await saveSubViews();
            }
        });
    };

    const toggleViewVisibility = async (viewId: string) => {
        const view = subViews()[viewId];
        if (!view) return;
        subViews.update(viewId, 'hidden', !view.hidden);
        await saveSubViews();
    };

    const toggleGroupInView = async (viewId: string, groupId: string) => {
        let view = subViews()[viewId];
        if (!view) return;

        subViews.update(viewId, 'groups', (groups: IBookmarkGroup['id'][]) => {
            if (groups.includes(groupId)) {
                return groups.filter(id => id !== groupId);
            } else {
                return [...groups, groupId];
            }
        });
        await saveSubViews();
    };

    const handleDragStart = (groupId: string, e: DragEvent) => {
        setDraggingGroup(groupId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (viewId: string, targetGroupId: string, e: DragEvent) => {
        e.preventDefault();
        const sourceGroupId = draggingGroup();
        if (!sourceGroupId) return;

        const view = subViews()[viewId];
        if (!view) return;

        subViews.update(viewId, 'groups', (groups: IBookmarkGroup['id'][]) => {
            const srcIdx = groups.indexOf(sourceGroupId);
            const targetIdx = groups.indexOf(targetGroupId);
            if (srcIdx === -1 || targetIdx === -1) return groups;
            let newGroups = structuredClone(groups);
            newGroups.splice(srcIdx, 1);
            newGroups.splice(targetIdx, 0, sourceGroupId);
            return newGroups;
        });

        await saveSubViews();
        setDraggingGroup(null);
    };

    const handleDefaultDrop = (targetGroupId: string, e: DragEvent) => {
        e.preventDefault();
        const sourceGroupId = draggingGroup();
        if (!sourceGroupId) return;

        const groupIds = defaultView().groups ?? [];
        const srcIdx = groupIds.indexOf(sourceGroupId);
        const targetIdx = groupIds.indexOf(targetGroupId);
        if (srcIdx === -1 || targetIdx === -1 || srcIdx === targetIdx) return;

        model.moveDefaultViewGroup(srcIdx, targetIdx);
        setDraggingGroup(null);
    };

    const toggleGroupInDefault = (groupId: string) => {
        const groupIds = defaultView().groups ?? [];
        if (groupIds.includes(groupId)) {
            model.removeGroupFromDefaultView(groupId);
        } else {
            model.addGroupToDefaultView(groupId);
        }
    }

    const defaultViewGroups = createMemo(() => {
        const groupIds = defaultView().groups ?? [];
        let inViews: IBookmarkGroup[] = [];
        let notInView: IBookmarkGroup[] = [];

        for (const group of groups) {
            const gid = group.id;
            if (groupIds.includes(gid)) {
                inViews.push(group);
            } else {
                notInView.push(group);
            }
        }

        inViews.sort((a, b) => groupIds.indexOf(a.id) - groupIds.indexOf(b.id));

        return {
            inViews,
            notInView
        }
    });

    const viewGroups = () => {
        const viewId = editingView();
        if (!viewId) return;
        const view = subViews()[viewId];
        if (!view) return;
        let inViews: IBookmarkGroup[] = [];
        let notInView: IBookmarkGroup[] = [];

        for (const group of groups) {
            const gid = group.id;
            if (view.groups.includes(gid)) {
                inViews.push(group);
            } else {
                notInView.push(group);
            }
        }

        // sort inViews as view groups order
        inViews.sort((a, b) => view.groups.indexOf(a.id) - view.groups.indexOf(b.id));

        return {
            inViews,
            notInView
        }
    }

    const BookmarkGroupItem: Component<{
        group: IBookmarkGroup;
        checked: boolean;
        draggable?: boolean;
        onToggle: () => void;
        onDragStart?: (e: DragEvent) => void;
        onDragOver?: (e: DragEvent) => void;
        onDrop?: (e: DragEvent) => void;
    }> = (props) => {
        return (
            <div
                style={{
                    display: "flex",
                    "align-items": "center",
                    padding: "8px",
                    "border-radius": "4px",
                    'border': '1px solid var(--b3-border-color)',
                    cursor: props.draggable ? "move" : "default",
                    gap: "4px"
                }}
                draggable={props.draggable}
                onDragStart={props.onDragStart}
                onDragOver={props.onDragOver}
                onDrop={props.onDrop}
            >
                <input
                    type="checkbox"
                    checked={props.checked}
                    onChange={props.onToggle}
                    style={{ margin: "0 8px 0 0" }}
                />
                <GroupIcon group={props.group} />
                <span>{props.group.name}</span>
            </div>
        );
    };

    return (
        <div
            class="fn__flex fn__flex-1 bookmark-config-group-list"
            style={{
                display: "flex",
                "flex-direction": "column",
                gap: "10px",
                padding: "16px",
                "font-size": "14px"
            }}
        >
            <div style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "margin-bottom": "4px",
            }}>
                <span style={{ "font-weight": "600" }}>{i18nSubview.default_view_title}</span>
            </div>

            <div style={{
                opacity: 0.72,
                "font-size": "12px",
                "margin-bottom": "8px"
            }}>
                {i18nSubview.default_view_desc}
            </div>

            <div style={{
                padding: "16px",
                background: "var(--b3-theme-surface)",
                "border-radius": "6px",
                "margin-bottom": "12px",
                border: "1px solid var(--b3-theme-surface-lighter)"
            }}>
                <div style={{
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "space-between",
                    "margin-bottom": editingDefault() ? "16px" : "0"
                }}>
                    <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                        <Icon symbol="iconBookmark" />
                        <span style={{ "font-weight": "500" }}>DEFAULT</span>
                        <span style={{ opacity: 0.62, "font-size": "12px" }}>
                            {i18nSubview.default_view_fixed}
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: "12px", "align-items": "center" }}>
                        <div
                            onClick={() => setEditingDefault(!editingDefault())}
                            style={{ cursor: "pointer", display: "flex", "align-items": "center" }}
                            class="ariaLabel"
                            aria-label={i18nSubview.default_view_edit}
                        >
                            <svg style={{ width: "16px", height: "16px" }}>
                                <use href="#iconEdit"></use>
                            </svg>
                        </div>
                    </div>
                </div>

                <Show when={editingDefault()}>
                    <div style={{
                        display: "flex",
                        "flex-direction": "column",
                        gap: "6px",
                        "margin-top": "16px",
                        "padding-top": "16px",
                        "border-top": "1px solid var(--b3-theme-surface-lighter)"
                    }}>
                        <div style={{ "font-weight": "500" }}>{i18n.src_components_setting_subviewlisttsx.current_view_bookmarks}</div>
                        <For each={defaultViewGroups().inViews}>
                            {(group) => (
                                <BookmarkGroupItem
                                    group={group}
                                    checked={true}
                                    draggable={true}
                                    onToggle={() => toggleGroupInDefault(group.id)}
                                    onDragStart={(e) => handleDragStart(group.id, e)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDefaultDrop(group.id, e)}
                                />
                            )}
                        </For>
                        <div style={{ "font-weight": "500" }}>{i18n.src_components_setting_subviewlisttsx.other_bookmark_groups}</div>
                        <For each={defaultViewGroups().notInView}>
                            {(group) => (
                                <BookmarkGroupItem
                                    group={group}
                                    checked={false}
                                    onToggle={() => toggleGroupInDefault(group.id)}
                                />
                            )}
                        </For>
                    </div>
                </Show>
            </div>

            <div style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "margin-bottom": "4px",
            }}>
                <span style={{ "font-weight": "600" }}>{i18n.src_components_setting_subviewlisttsx.bookmark_subview}</span>
                <div
                    onClick={createNewView}
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
                    <span>{i18n.src_components_setting_subviewlisttsx.new_view}</span>
                </div>
            </div>

            <For each={viewList()}>
                {(view) => (
                    <div style={{
                        padding: "16px",
                        background: "var(--b3-theme-surface)",
                        "border-radius": "6px",
                        "margin-bottom": "8px",
                        border: "1px solid var(--b3-theme-surface-lighter)"
                    }}>
                        <div style={{
                            display: "flex",
                            "align-items": "center",
                            "justify-content": "space-between",
                            "margin-bottom": editingView() === view.id ? "16px" : "0"
                        }}>
                            <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                                <span style={{ display: 'contents', cursor: 'pointer' }} onClick={(e: MouseEvent) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    selectGroupIcon({
                                        show: 'symbols',
                                        onReset: () => {},
                                        onUpdate: (icon) => {
                                            subViews.update(view.id, 'icon', icon);
                                        }
                                    })
                                }}>
                                    <Icon symbol={view.icon.value} />
                                </span>
                                <span style={{ "font-weight": "500" }}
                                    onClick={(e: MouseEvent) => {
                                        e.preventDefault();
                                        inputDialog({
                                            title: '修改视图名称',
                                            defaultText: view.name,
                                            confirm: (value: string) => {
                                                subViews.update(view.id, 'name', value);
                                            }
                                        })
                                    }}
                                >
                                    {view.name}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: "12px", "align-items": "center" }}>
                                <SelectInput
                                    value={view.dockPosition ?? "RightBottom"}
                                    options={{
                                        "LeftTop": i18n.src_components_setting_subviewlisttsx.top_left,
                                        "LeftBottom": i18n.src_components_setting_subviewlisttsx.bottom_left,
                                        "RightTop": i18n.src_components_setting_subviewlisttsx.top_right,
                                        "RightBottom": i18n.src_components_setting_subviewlisttsx.bottom_right
                                    }}
                                    changed={(value: "RightTop" | "RightBottom" | "LeftTop" | "LeftBottom") => {
                                        subViews.update(view.id, 'dockPosition', value);
                                    }}
                                />
                                <div
                                    onClick={() => toggleViewVisibility(view.id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <svg style={{ width: "16px", height: "16px" }}>
                                        <use href={view.hidden ? "#iconEyeoff" : "#iconEye"}></use>
                                    </svg>
                                </div>
                                <div
                                    onClick={() => setEditingView(view.id === editingView() ? null : view.id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <svg style={{ width: "16px", height: "16px" }}>
                                        <use href="#iconEdit"></use>
                                    </svg>
                                </div>
                                <div
                                    onClick={() => deleteView(view.id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <svg style={{ width: "16px", height: "16px" }}>
                                        <use href="#iconTrashcan"></use>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <Show when={editingView() === view.id}>
                            <div style={{
                                display: "flex",
                                "flex-direction": "column",
                                gap: "6px",
                                "margin-top": "16px",
                                "padding-top": "16px",
                                "border-top": "1px solid var(--b3-theme-surface-lighter)"
                            }}>
                                <div style={{ "font-weight": "500" }}>{i18n.src_components_setting_subviewlisttsx.current_view_bookmarks}</div>
                                <For each={viewGroups().inViews}>
                                    {(group) => (
                                        <BookmarkGroupItem
                                            group={group}
                                            checked={true}
                                            draggable={true}
                                            onToggle={() => toggleGroupInView(view.id, group.id)}
                                            onDragStart={(e) => handleDragStart(group.id, e)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(view.id, group.id, e)}
                                        />
                                    )}
                                </For>
                                <div style={{ "font-weight": "500" }}>{i18n.src_components_setting_subviewlisttsx.other_bookmark_groups}</div>
                                <For each={viewGroups().notInView}>
                                    {(group) => (
                                        <BookmarkGroupItem
                                            group={group}
                                            checked={false}
                                            onToggle={() => toggleGroupInView(view.id, group.id)}
                                        />
                                    )}
                                </For>
                            </div>
                        </Show>
                    </div>
                )}
            </For>
        </div>
    );
};

export default SubViewList;