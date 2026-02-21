import { Component, For, Show, createMemo, createSignal } from "solid-js";
import { defaultView, groups, saveSubViews, subViews } from "@/model/stores";
import { getModel } from "@/model";
import { GroupIcon } from "../elements/group-icon";
import { i18n } from "@/utils/i18n";

const GroupRow: Component<{
    group: IBookmarkGroup;
    draggable?: boolean;
    actionText: string;
    onAction: () => void;
    onDragStart?: (e: DragEvent) => void;
    onDragOver?: (e: DragEvent) => void;
    onDrop?: (e: DragEvent) => void;
}> = (props) => {
    return (
        <div
            class="view-group-config__row"
            style={{
                display: "flex",
                "align-items": "center",
                padding: "6px 8px",
                "border-radius": "4px",
                border: "1px solid var(--b3-border-color)",
                cursor: props.draggable ? "move" : "default",
                gap: "6px"
            }}
            draggable={props.draggable}
            onDragStart={props.onDragStart}
            onDragOver={props.onDragOver}
            onDrop={props.onDrop}
        >
            <GroupIcon group={props.group} />
            <span class="fn__flex-1" style={{ overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
                {props.group.name}
            </span>
            <Show when={props.draggable}>
                <span style={{ opacity: 0.62, "font-size": "12px", "user-select": "none" }}>↕</span>
            </Show>
            <button class="b3-button b3-button--outline view-group-config__action" onClick={props.onAction}>
                {props.actionText}
            </button>
        </div>
    );
};

const ViewGroupConfig: Component<{
    sourceView: "DEFAULT" | string;
    maxHeight?: string;
}> = (props) => {
    const model = getModel();
    const [draggingGroup, setDraggingGroup] = createSignal<string | null>(null);

    const currentView = createMemo(() => {
        if (props.sourceView === "DEFAULT") return null;
        return subViews()[props.sourceView];
    });

    const addGroup = async (groupId: string) => {
        if (props.sourceView === "DEFAULT") {
            model.addGroupToDefaultView(groupId);
            return;
        }

        const view = subViews()[props.sourceView];
        if (!view) return;

        subViews.update(props.sourceView, "groups", (groupIds: IBookmarkGroup["id"][]) => {
            if (groupIds.includes(groupId)) return groupIds;
            return [...groupIds, groupId];
        });
        await saveSubViews();
    };

    const removeGroup = async (groupId: string) => {
        if (props.sourceView === "DEFAULT") {
            model.removeGroupFromDefaultView(groupId);
            return;
        }

        const view = subViews()[props.sourceView];
        if (!view) return;

        subViews.update(props.sourceView, "groups", (groupIds: IBookmarkGroup["id"][]) => {
            return groupIds.filter(id => id !== groupId);
        });
        await saveSubViews();
    };

    const handleDragStart = (groupId: string, e: DragEvent) => {
        setDraggingGroup(groupId);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (targetGroupId: string, e: DragEvent) => {
        e.preventDefault();
        const sourceGroupId = draggingGroup();
        if (!sourceGroupId) return;

        if (props.sourceView === "DEFAULT") {
            const groupIds = defaultView().groups ?? [];
            const srcIdx = groupIds.indexOf(sourceGroupId);
            const targetIdx = groupIds.indexOf(targetGroupId);
            if (srcIdx === -1 || targetIdx === -1 || srcIdx === targetIdx) return;

            model.moveDefaultViewGroup(srcIdx, targetIdx);
            setDraggingGroup(null);
            return;
        }

        const view = subViews()[props.sourceView];
        if (!view) return;

        subViews.update(props.sourceView, "groups", (groupIds: IBookmarkGroup["id"][]) => {
            const srcIdx = groupIds.indexOf(sourceGroupId);
            const targetIdx = groupIds.indexOf(targetGroupId);
            if (srcIdx === -1 || targetIdx === -1) return groupIds;
            const newGroups = structuredClone(groupIds);
            newGroups.splice(srcIdx, 1);
            newGroups.splice(targetIdx, 0, sourceGroupId);
            return newGroups;
        });

        await saveSubViews();
        setDraggingGroup(null);
    };

    const groupedData = createMemo(() => {
        const groupIds = props.sourceView === "DEFAULT"
            ? (defaultView().groups ?? [])
            : (currentView()?.groups ?? []);
        const inViews: IBookmarkGroup[] = [];
        const notInView: IBookmarkGroup[] = [];

        for (const group of groups) {
            if (groupIds.includes(group.id)) {
                inViews.push(group);
            } else {
                notInView.push(group);
            }
        }

        inViews.sort((a, b) => groupIds.indexOf(a.id) - groupIds.indexOf(b.id));
        return { inViews, notInView };
    });

    const containerHeight = () => props.maxHeight ?? "420px";
    const isFullHeight = () => containerHeight() === "100%";

    return (
        <Show when={props.sourceView === "DEFAULT" || currentView()}>
            <div class="view-group-config" style={{
                display: "flex",
                gap: "10px",
                width: "100%",
                height: isFullHeight() ? "100%" : undefined,
                "min-height": "0"
            }} data-source-view={props.sourceView}>
                <div class="view-group-config__panel" style={{
                    flex: 1,
                    height: isFullHeight() ? "100%" : undefined,
                    "min-width": "0",
                    display: "flex",
                    "flex-direction": "column",
                    gap: "6px",
                    padding: "8px",
                    "box-sizing": "border-box",
                    border: "1px solid var(--b3-theme-surface-lighter)",
                    "border-radius": "6px"
                }}>
                    <div style={{ "font-weight": "500", "font-size": "13px" }}>{i18n.src_components_setting_subviewlisttsx.other_bookmark_groups}</div>
                    <div class="view-group-config__list" style={{
                        display: "flex",
                        "flex-direction": "column",
                        flex: isFullHeight() ? 1 : undefined,
                        gap: "5px",
                        "min-height": isFullHeight() ? "0" : undefined,
                        "max-height": isFullHeight() ? undefined : containerHeight(),
                        "padding-right": "6px",
                        "overflow-y": "auto"
                    }}>
                        <For each={groupedData().notInView}>
                            {(group) => (
                                <GroupRow
                                    group={group}
                                    actionText="添加"
                                    onAction={() => addGroup(group.id)}
                                />
                            )}
                        </For>
                    </div>
                </div>

                <div class="view-group-config__panel" style={{
                    flex: 1,
                    height: isFullHeight() ? "100%" : undefined,
                    "min-width": "0",
                    display: "flex",
                    "flex-direction": "column",
                    gap: "6px",
                    padding: "8px",
                    "box-sizing": "border-box",
                    border: "1px solid var(--b3-theme-surface-lighter)",
                    "border-radius": "6px"
                }}>
                    <div style={{ "font-weight": "500", "font-size": "13px" }}>{i18n.src_components_setting_subviewlisttsx.current_view_bookmarks}</div>
                    <div class="view-group-config__list" style={{
                        display: "flex",
                        "flex-direction": "column",
                        flex: isFullHeight() ? 1 : undefined,
                        gap: "5px",
                        "min-height": isFullHeight() ? "0" : undefined,
                        "max-height": isFullHeight() ? undefined : containerHeight(),
                        "padding-right": "6px",
                        "overflow-y": "auto"
                    }}>
                        <For each={groupedData().inViews}>
                            {(group) => (
                                <GroupRow
                                    group={group}
                                    draggable={true}
                                    actionText="移除"
                                    onAction={() => removeGroup(group.id)}
                                    onDragStart={(e) => handleDragStart(group.id, e)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(group.id, e)}
                                />
                            )}
                        </For>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default ViewGroupConfig;