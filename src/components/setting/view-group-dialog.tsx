import { Plugin } from "siyuan";
import { solidDialog } from "@/libs/dialog";
import { subViews } from "@/model/stores";
import { i18n } from "@/utils/i18n";
import Icon from "../elements/icon";
import ViewGroupConfig from "./view-group-config";

const ViewGroupDialog = (props: {
    sourceView: "DEFAULT" | string;
    onBackToSetting: () => void;
}) => {
    const isDefault = () => props.sourceView === "DEFAULT";
    const viewName = () => {
        if (isDefault()) return i18n.bookmark.logo.name;
        return subViews()[props.sourceView]?.name ?? i18n.bookmark.logo.name;
    };
    const iconSymbol = () => {
        if (isDefault()) return "iconBookmark";
        return subViews()[props.sourceView]?.icon?.value ?? "iconBookmark";
    };

    return (
        <div style={{
            display: "flex",
            "flex-direction": "column",
            width: "100%",
            height: "100%",
            padding: "16px",
            "box-sizing": "border-box",
            gap: "10px",
            "min-height": "0"
        }}>
            <div style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                gap: "8px"
            }}>
                <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                    <Icon symbol={iconSymbol()} />
                    <div style={{ "font-weight": "600" }}>{viewName()}</div>
                </div>
                <button class="b3-button b3-button--outline" onClick={props.onBackToSetting}>
                    返回到主设置
                </button>
            </div>

            <div style={{
                flex: 1,
                "min-height": "0",
                padding: "16px",
                background: "var(--b3-theme-surface)",
                "border-radius": "6px",
                border: "1px solid var(--b3-theme-surface-lighter)",
                overflow: "hidden"
            }}>
                <ViewGroupConfig sourceView={props.sourceView} maxHeight="100%" />
            </div>
        </div>
    );
};

export const openViewGroupDialog = (args: {
    plugin: Plugin;
    sourceView: "DEFAULT" | string;
}) => {
    let closeDialog: (() => void) | null = null;
    const { close } = solidDialog({
        title: i18n.bookmark.logo.setting,
        width: "1080px",
        height: "760px",
        maxWidth: "95%",
        maxHeight: "95%",
        loader: () => (
            <ViewGroupDialog
                sourceView={args.sourceView}
                onBackToSetting={() => {
                    closeDialog?.();
                    args.plugin.openSetting();
                }}
            />
        )
    });
    closeDialog = close;
};

export default ViewGroupDialog;