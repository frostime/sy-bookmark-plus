import { Component, For, Show, createMemo, createSignal } from "solid-js";
import { subViews, saveSubViews } from "@/model/stores";
import { confirmDialog } from "@/libs/dialog";
import { showMessage } from "siyuan";
import { inputDialog } from "@frostime/siyuan-plugin-kits";
import Icon from "../elements/icon";
import { selectGroupIcon } from "../elements/select-icon";
import { SelectInput } from "@/libs/components/Elements";
import { destroyBookmark } from "@/dock-views";
import { i18n } from "@/utils/i18n";
import ViewGroupConfig from "./view-group-config";


const SubViewList: Component = () => {
    const i18nSubview = i18n.src_components_setting_subviewlisttsx as any;
    const [editingView, setEditingView] = createSignal<string | null>(null);
    const [editingDefault, setEditingDefault] = createSignal<boolean>(false);

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
                    <ViewGroupConfig sourceView="DEFAULT" maxHeight="360px" />
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
                            <ViewGroupConfig sourceView={view.id} maxHeight="360px" />
                        </Show>
                    </div>
                )}
            </For>
        </div>
    );
};

export default SubViewList;