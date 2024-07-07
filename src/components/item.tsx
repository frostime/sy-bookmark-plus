import { Component, createEffect, createMemo, createSignal, useContext } from "solid-js";
import { Menu, openTab, showMessage } from "siyuan";
import { buildItemDetail } from "../libs/dom";

import { itemInfo, setGroups, groupMap } from "../model";

import { BookmarkContext, itemMoving, setItemMoving } from "./context";

import { i18n } from "@/utils/i18n";

interface IProps {
    group: TBookmarkGroupId;
    itemCore: IItemCore;
    deleteItem: (i: IBookmarkItem) => void;
}


const setStyleBtn = (key: string, label: string): HTMLElement => {
    let html = '';
    if (key === 'clear') {
        html = `
    <button class="b3-menu__item" style="align-items: center;">
        <span  class="color__square">A</span>
        <span class="b3-menu__label">${label}</span>
    </button>
    `;
    } else {
        html = `
    <button class="b3-menu__item" style="align-items: center;">
        <span style="color: var(--b3-card-${key}-color); background-color: var(--b3-card-${key}-background);" class="color__square">A</span>
        <span class="b3-menu__label">${label}</span>
    </button>
    `;
    }

    let div = document.createElement('div');
    div.innerHTML = html;
    return div.firstElementChild as HTMLElement;
}


const Item: Component<IProps> = (props) => {
    const item = () => itemInfo[props.itemCore.id];

    const i18n_ = i18n.item;

    const [NodeType, setNodeType] = createSignal<string>("");
    const [Icon, setIcon] = createSignal<string>("");
    const [opacityStyle, setOpacityStyle] = createSignal<string>("");
    const [titleStyle, setTitleStyle] = createSignal<string>("");

    const inDynamicGroup = () => {
        return groupMap().get(props.group)?.type === 'dynamic';
    }

    const dragovered = createMemo(() => {
        let value = itemMoving();
        if (value.targetGroup === props.group && value.afterItem === props.itemCore.id) {
            return 'dragovered';
        } else {
            return '';
        }
    });

    createEffect(() => {
        let value = item();
        if (value) {
            const e = buildItemDetail(value);
            setNodeType(e.NodeType);
            setIcon(e.Icon);
            if (value.err === 'BoxClosed') {
                setTitleStyle('color: var(--b3-theme-on-surface-light);');
            } else if (value.err === 'BlockDeleted') {
                setTitleStyle('color: var(--b3-theme-error);');
            } else {
                setTitleStyle('');
            }
        }
    });

    const { plugin, model, shownGroups } = useContext(BookmarkContext);

    const setStyle = (style: string) => {
        setGroups(
            (g) => g.id === props.group, 'items',
            (it) => it.id === item().id, 'style', style
        );
        model.save();
    }

    const showItemContextMenu = (e: MouseEvent) => {
        e.stopPropagation();
        const menu = new Menu();
        menu.addItem({
            label: i18n_.copyref,
            icon: "iconRef",
            click: () => {
                navigator.clipboard
                    .writeText(`((${item().id} '${item().title.replaceAll('\n', '')}'))`)
                    .then(() => {
                        showMessage(i18n_.msgcopy);
                    });
            },
        });
        menu.addItem({
            label: i18n_.copylink,
            icon: "iconSiYuan",
            click: () => {
                navigator.clipboard
                    .writeText(`[${item().title.replaceAll('\n', '')}](siyuan://blocks/${item().id})`)
                    .then(() => {
                        showMessage(i18n_.msgcopy);
                    });
            },
        });
        menu.addSeparator();
        menu.addItem({
            label: i18n_.style,
            icon: 'iconTheme',
            type: 'submenu',
            submenu: [
                {
                    element: setStyleBtn('info', window.siyuan.languages.infoStyle),
                    click: () => {
                        setStyle('color: var(--b3-card-info-color);background-color: var(--b3-card-info-background);')
                    }
                },
                {
                    element: setStyleBtn('success', window.siyuan.languages.successStyle),
                    click: () => {
                        setStyle('color: var(--b3-card-success-color);background-color: var(--b3-card-success-background);')
                    }
                },
                {
                    element: setStyleBtn('warning', window.siyuan.languages.warningStyle),
                    click: () => {
                        setStyle('color: var(--b3-card-warning-color);background-color: var(--b3-card-warning-background);')
                    }
                },
                {
                    element: setStyleBtn('error', window.siyuan.languages.errorStyle),
                    click: () => {
                        setStyle('color: var(--b3-card-error-color);background-color: var(--b3-card-error-background);')
                    }
                },
                {
                    element: setStyleBtn('clear', window.siyuan.languages.clearFontStyle),
                    click: () => {
                        setStyle('')
                    }
                },
            ]
        })
        menu.addSeparator();
        if (!inDynamicGroup()) {
            const groups = shownGroups().filter((g) => g.id !== props.group && g.type !== 'dynamic').map((g) => {
                return {
                    label: g.name,
                    click: () => {
                        model.transferItem(props.group, g.id, item());
                    },
                };
            });
            menu.addItem({
                label: i18n_.transfer,
                icon: "iconFolder",
                type: 'submenu',
                submenu: groups
            });
            menu.addItem({
                label: i18n_.move,
                icon: 'iconMove',
                type: 'submenu',
                submenu: [
                    {
                        label: i18n_.top,
                        icon: "iconTop",
                        click: () => {
                            model.reorderItem(props.group, item(), 'top');
                        }
                    },
                    {
                        label: i18n_.bottom,
                        icon: "iconTop",
                        iconClass: "rotate-180",
                        click: () => {
                            model.reorderItem(props.group, item(), 'bottom');
                        }
                    }
                ]
            });
        }
        menu.addItem({
            label: i18n_.del,
            icon: "iconTrashcan",
            click: () => {
                props.deleteItem(item());
            },
        });
        menu.open({
            x: e.clientX,
            y: e.clientY,
        });
    };

    const openBlock = () => {
        openTab({
            app: plugin.app,
            doc: {
                id: item().id,
                zoomIn: item().type === 'd' ? false : true,
            },
        });
    };

    const onDragStart = (event: DragEvent) => {
        console.log('Drag Start', item());
        event.dataTransfer.setData("bookmark/item", JSON.stringify({ group: props.group, id: item().id }));
        event.dataTransfer.effectAllowed = "move";
        setOpacityStyle('opacity: 0.5;');
        setItemMoving({
            srcGroup: props.group,
            srcItem: item().id,
            targetGroup: '',
            afterItem: ''
        });
    };

    const onDragEnd = (event: DragEvent) => {
        event.dataTransfer.clearData();
        setOpacityStyle('');
        setItemMoving({
            srcGroup: "",
            srcItem: "",
            targetGroup: "",
            afterItem: "",
        });
    };

    const BindDragEvent = {
        draggable: true,
        onDragStart: onDragStart,
        onDragEnd: onDragEnd,
    }

    return (
        <li
            class={`b3-list-item b3-list-item--hide-action custom-bookmark-item ${dragovered()}`}
            style={`${opacityStyle()} ${props.itemCore?.style ?? ''}`}
            {...(inDynamicGroup() ? { draggable: false } : BindDragEvent)}
            data-node-id={item().id}
            data-ref-text=""
            data-def-id=""
            data-type={NodeType()}
            data-subtype=""
            data-treetype="bookmark"
            data-def-path=""
            onContextMenu={showItemContextMenu}
            onClick={openBlock}
        >
            <span
                style="padding-left: 22px;margin-right: 2px"
                class="b3-list-item__toggle fn__hidden"
            >
                <svg data-id={item().id} class="b3-list-item__arrow">
                    <use href="#iconRight"></use>
                </svg>
            </span>
            <div innerHTML={Icon()} />
            <span class="b3-list-item__text ariaLabel" data-position="parentE" style={titleStyle()}>
                {item().title}
            </span>
            <span
                class="b3-list-item__action"
                role="button"
                tabindex="0"
                onClick={(e) => {
                    e.stopPropagation();
                    showItemContextMenu(e);
                }}
            >
                <svg>
                    <use href="#iconMore"></use>
                </svg>
            </span>
            <span class="fn__space" />
        </li>
    );
};

export default Item;
