import { Accessor, Show, createSignal } from "solid-js";
import { render } from "solid-js/web";

import Form from "@/libs/components/Form";
import Icon from "./elements/icon";
import { RuleEditor, NewGroupContext } from "./new-group";
import { selectGroupIcon } from "./elements/select-icon";
import { i18n } from "@/utils/i18n";
import { confirmDialog } from "@frostime/siyuan-plugin-kits";

export const EditGroup = (props: {
    group: IBookmarkGroup;
    setGroup: (arg: { name?: string }) => void;
    setRule: (arg: { type?: string, input?: string }) => void;
    icon: Accessor<IBookmarkGroup['icon']>;
    setIcon: (args: IBookmarkGroup['icon']) => void;
}) => {
    const i18n_ = i18n.newgroup;

    const [groupType, setGroupType] = createSignal<TBookmarkGroupType>((props.group.type ?? 'normal') as TBookmarkGroupType);
    const [ruleType, setRuleType] = createSignal<TRuleType>((props.group.rule?.type ?? 'sql') as TRuleType);
    const [ruleInput, setRuleInput] = createSignal(props.group.rule?.input ?? '');

    const changeGroupIcon = () => {
        selectGroupIcon({
            show: 'all',
            onReset: () => {
                props.setIcon(null);
            },
            onUpdate: (icon) => {
                props.setIcon(icon);
            }
        });
    };

    return (
        <div class="fn__flex fn__flex-1 fn__flex-column" onkeydown={(e) => {
            if (e.key === 'Enter') {
                e.stopImmediatePropagation();
            }
        }}>
            <Form.Wrap
                title={i18n_.name[0]}
                description={i18n_.name[1]}
            >
                <Form.Input
                    key="name"
                    value={props.group.name}
                    type="textinput"
                    changed={(v) => {
                        props.setGroup({ name: v });
                    }}
                />
            </Form.Wrap>

            <Form.Wrap
                title={i18n_.type[0]}
                description={i18n_.type[1]}
            >
                <span class="b3-label__text">
                    {groupType() === 'dynamic' ? i18n.bookmarktype.dynamic : i18n.bookmarktype.normal}
                </span>
            </Form.Wrap>

            <Form.Wrap
                title={i18n_.icontitle}
                description={i18n_.icondesc}
            >
                <div style={{ display: 'flex', "align-items": 'center' }} onClick={changeGroupIcon}>
                    {(() => {
                        if (!props.icon()) {
                            return <Icon symbol={groupType() === 'normal' ? 'iconFolder' : 'iconSearch'} />;
                        } else if (props.icon()?.type === 'symbol') {
                            return <Icon symbol={props.icon()?.value} />;
                        } else {
                            return <Icon emojiCode={props.icon()?.value} />;
                        }
                    })()}
                </div>
            </Form.Wrap>

            <Show when={groupType() === 'dynamic'}>
                <NewGroupContext.Provider value={{
                    groupType,
                    setGroupType,
                    ruleType,
                    setRuleType,
                    ruleInput,
                    setRuleInput,
                    setRule: props.setRule
                }}>
                    <RuleEditor lockRuleType={true} />
                </NewGroupContext.Provider>
            </Show>
        </div>
    );
};

export const createEditGroup = (group: IBookmarkGroup, confirmCb: (data: {
    group: { name: string };
    rule: { type: TRuleType; input: string };
    icon: IBookmarkGroup['icon'];
}) => void) => {
    const container = document.createElement("div") as HTMLDivElement;
    container.style.display = 'contents';

    const [groupInfo, setGroupInfo] = createSignal({
        name: group.name
    });
    const [rule, setRule] = createSignal({
        type: group.rule?.type ?? 'sql',
        input: group.rule?.input ?? ''
    });
    const [icon, setIcon] = createSignal<IBookmarkGroup['icon']>(group.icon ?? null);

    render(() => EditGroup({
        group,
        setGroup: (args) => {
            const current = groupInfo();
            const newval = { ...current, ...args };
            setGroupInfo(newval);
        },
        setRule: (args) => {
            const current = rule();
            const newval = {
                ...current,
                ...args,
                type: (args.type ?? current.type) as TRuleType
            };
            setRule(newval);
        },
        icon,
        setIcon
    }), container);

    confirmDialog({
        title: i18n.group.edit,
        content: container,
        width: '800px',
        confirm: () => {
            confirmCb({
                group: groupInfo(),
                rule: rule(),
                icon: icon()
            });
        }
    });
};
