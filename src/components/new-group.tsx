import { Accessor, createMemo, createSignal, Setter, Show } from "solid-js";

// import ItemWrap from "@/libs/components/item-wrap";
// import InputItem from "@/libs/components/item-input";
import Form from "@/libs/components/Form";
import Icon from "./elements/icon";

import { i18n } from "@/utils/i18n";
import { Transition } from "solid-transition-group";
import { decodeDynamicRuleInput, encodeDynamicRuleInput } from "@/model/rules";

import { RuleTemplate } from "@/utils/const";

import { createContext, useContext } from "solid-js";

import { selectGroupIcon } from "./elements/select-icon";
import { confirmDialog } from "@frostime/siyuan-plugin-kits";
import { render } from "solid-js/web";

export const NewGroupContext = createContext<{
    groupType: Accessor<TBookmarkGroupType>;
    setGroupType: Setter<TBookmarkGroupType>;
    ruleType: Accessor<TRuleType>;
    setRuleType: Setter<TRuleType>;
    ruleInput: Accessor<string>;
    setRuleInput: Setter<string>;

    setRule: (arg: { type?: string, input?: string }) => void;
}>();

export const useNewGroup = () => useContext(NewGroupContext);

const RuleInput = () => {
    const { ruleType, ruleInput, setRule } = useNewGroup();

    const i18nPost = i18n.newgroup.postprocess;
    const render = () => {
        if (ruleType() === 'attr') {
            return (
                <Form.Input
                    key="ruleInput"
                    value={ruleInput()}
                    type='textinput'
                    changed={(v) => {
                        setRule({ input: v });
                    }}
                    style={{ 'flex': 1, 'width': '100%' }}
                />
            );
        } else if (ruleType() === 'sql' || ruleType() === 'js') {
            return (
                <Form.Input
                    key="ruleInput"
                    value={ruleInput()}
                    type='textarea'
                    changed={(v) => {
                        setRule({ input: v });
                    }}
                />
            );
        } else if (ruleType() === 'backlinks') {
            const decoded = createMemo(() => {
                return decodeDynamicRuleInput('backlinks', ruleInput()) as { id: string; process: '' | 'fb2p' | 'b2doc' };
            });
            const updateBacklinksRule = (args: { id?: string; process?: '' | 'fb2p' | 'b2doc' }) => {
                const current = decoded();
                const next = {
                    id: args.id ?? current.id,
                    process: args.process ?? current.process,
                };
                setRule({ input: encodeDynamicRuleInput('backlinks', next) });
            }
            return (
                <>
                    <Form.Input
                        key="ruleInput"
                        value={decoded().id}
                        type='textinput'
                        changed={(v) => {
                            updateBacklinksRule({ id: v });
                        }}
                        style={{ 'flex': 1, 'width': '100%' }}
                    />
                    <div style={{ display: 'flex', 'gap': '2px' }}>
                        <span
                            class="ariaLabel"
                            aria-label={i18nPost.ariaLabel}
                            style="display: flex; align-items: center; justify-content: center;"
                        >
                            <Icon
                                symbol="iconHelp"
                                width="13px"
                                height="13px"
                                style={{
                                    cursor: 'pointer'
                                }}
                            />
                        </span>
                        <div class="b3-label__text fn__flex-1">{i18nPost.name}</div>
                        <Form.Input
                            key="ruleInput"
                            value={decoded().process}
                            type='select'
                            options={{
                                '': i18nPost.omit,
                                'fb2p': i18nPost.fb2p,
                                'b2doc': i18nPost.b2doc
                            }}
                            changed={(v) => {
                                updateBacklinksRule({ process: v as '' | 'fb2p' | 'b2doc' });
                            }}
                        />
                    </div>
                </>
            )
        } else {
            return <>Fallback!</>
        }
    }

    return <>{render()}</>
}

type TAbout = { desc: string; direction: "row" | "column"; };
export const RuleEditor = (props?: { lockRuleType?: boolean }) => {
    const i18n_ = i18n.newgroup;

    const { ruleType, setRuleType, setRuleInput, setRule } = useNewGroup();

    //模板的值 key: templateString
    let template: Accessor<{ [key: string]: string }> = createMemo(() => {
        let template = RuleTemplate?.[ruleType()] ?? {};
        return { no: '', ...template };
    });
    //模板 key: templateName
    const templateToSelect = (): { [key: string]: string } => {
        return Object.keys(template()).reduce((obj, key) => {
            let text = i18n.template[ruleType()][key];
            obj[key] = text ?? '';
            return obj;
        }, {} as { [key: string]: string });
    }


    let aboutRule = createMemo<TAbout>(() => {
        switch (ruleType()) {
            case 'sql':
                return {
                    desc: i18n_.desc.sql,
                    direction: "row",
                    // input: "textarea"
                }

            case 'backlinks':
                return {
                    desc: i18n_.desc.backlinks,
                    direction: "row",
                    // input: "textinput"
                }

            case 'attr':
                return {
                    desc: i18n_.desc.attr,
                    direction: "row",
                    // input: "textinput"
                }

            case 'js':
                return {
                    desc: i18n.src_components_newgrouptsx.query_block_list,
                    direction: "row",
                }

            default:
                break;
        }
        return {
            desc: i18n_.desc.sql,
            direction: "row",
            // input: "textarea"
        };
    });

    return (
        <div style={{ display: "flex", "flex-direction": 'column' }}>
            <Form.Wrap
                title={i18n_.rtype[0]}
                description={i18n_.rtype[1]}
            >
                <Show
                    when={!props?.lockRuleType}
                    fallback={<span class="b3-label__text">{i18n.ruletype[ruleType()]}</span>}
                >
                    <Form.Input
                        key="ruleType"
                        value={ruleType()}
                        type="select"
                        options={{
                            sql: i18n.ruletype.sql,
                            backlinks: i18n.ruletype.backlinks,
                            attr: i18n.ruletype.attr,
                            js: 'JavaScript'
                        }}
                        changed={(v) => {
                            setRule({ type: v, input: '' });
                            setRuleType(v);
                            setRuleInput('');
                        }}
                    />
                </Show>
            </Form.Wrap>
            <Form.Wrap
                title={i18n_.rinput}
                description={aboutRule().desc}
                direction={aboutRule().direction}
                action={
                    // 选择模板的 action 下拉框
                    <Show when={['sql', 'attr'].includes(ruleType())}>
                        <div style={{
                            display: "flex",
                            gap: '10px',
                            padding: '0px',
                            margin: 0,
                            'align-items': 'center'
                        }}>
                            <span class="b3-label__text">{i18n_.choosetemplate}</span>
                            <Form.Input
                                key="ruleTemplate"
                                value={'no'}
                                options={templateToSelect()}
                                type='select'
                                changed={(key) => {
                                    let temp = template()[key].trim();
                                    setRuleInput(temp);
                                    setRule({ input: temp });
                                }}
                                style={{ 'width': '130px' }}
                            />
                        </div>
                    </Show>
                }
            >
                <RuleInput />
            </Form.Wrap>
        </div>
    );
}


export const NewGroup = (props: {
    setGroup: (arg: { name?: string, type?: TBookmarkGroupType }) => void;
    setRule: (arg: { type?: string, input?: string }) => void;
    icon: Accessor<IBookmarkGroup['icon']>;
    setIcon: (args: IBookmarkGroup['icon']) => void;
}) => {
    // let grouptype = 'normal';
    const i18n_ = i18n.newgroup;

    let [groupType, setGroupType] = createSignal<TBookmarkGroupType>("normal");
    let [ruleType, setRuleType] = createSignal<TRuleType>("sql");

    let [ruleInput, setRuleInput] = createSignal('');

    props.setGroup({ name: 'New Group' });

    const transitionDuration = 100;

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
    }

    return (
        <div class="fn__flex fn__flex-1 fn__flex-column"
            onkeydown={(e) => {
                if (e.key === 'Enter') {
                    e.stopImmediatePropagation(); // 防止 enter 让 dialog 直接 confirm 了
                }
            }}
        >
            <div style={{ display: "flex", "flex-direction": 'column' }}>
                <Form.Wrap
                    title={i18n_.name[0]}
                    description={i18n_.name[1]}
                >
                    <Form.Input
                        key="name"
                        value="New Group"
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
                    <Form.Input
                        key="type"
                        value={groupType()}
                        type="select"
                        options={{
                            normal: i18n.bookmarktype.normal,
                            dynamic: i18n.bookmarktype.dynamic,
                            // composed: i18n.bookmarktype.composed
                        }}
                        changed={(v) => {
                            props.setGroup({ type: v });
                            setGroupType(v);
                            if (v !== 'normal') {
                                props.setRule({ type: ruleType() });
                            }
                        }}
                    />
                </Form.Wrap>
                <Form.Wrap
                    title={i18n_.icontitle}
                    description={i18n_.icondesc}
                >
                    <div style={{ display: 'flex', "align-items": 'center' }} onClick={changeGroupIcon}>
                        {(() => {
                            if (!props.icon()) {
                                return  <Icon symbol={groupType() === 'normal' ? 'iconFolder' : 'iconSearch'} />
                            } else if (props.icon()?.type === 'symbol') {
                                return <Icon symbol={props.icon()?.value} />
                            } else {
                                return <Icon emojiCode={props.icon()?.value} />
                            }
                        })()}
                    </div>
                </Form.Wrap>
            </div>
            <Transition
                onExit={(el, done) => {
                    const a = el.animate({
                        opacity: [1, 0],
                        transform: ['translateY(0)', 'translateY(-5px)'],
                    }, {
                        duration: transitionDuration,
                        easing: 'ease-in-out'
                    });
                    a.finished.then(done);
                }}
                onEnter={(el, done) => {
                    const a = el.animate({
                        opacity: [0, 1],
                        transform: ['translateY(-5px)', 'translateY(0)'],
                    }, {
                        duration: transitionDuration,
                        easing: 'ease-in-out'
                    });
                    a.finished.then(done);
                }}
            >
                <Show when={groupType() !== 'normal'}>
                    <NewGroupContext.Provider value={{ groupType, setGroupType, ruleType, setRuleType, ruleInput, setRuleInput, setRule: props.setRule }}>
                        <RuleEditor />
                    </NewGroupContext.Provider>
                </Show>
            </Transition>
        </div>
    )
}

export const createNewGroup = (confirmCb: (data: any) => void) => {
    let container = document.createElement("div") as HTMLDivElement;
    container.style.display = 'contents';

    const [group, setGroup] = createSignal({ name: "", type: "normal" });
    const [rule, setRule] = createSignal({ type: "", input: "" });
    const [icon, setIcon] = createSignal<IBookmarkGroup['icon'] | null>(null);

    render(() => NewGroup({
        setGroup: (args) => {
            let current = group();
            let newval = { ...current, ...args };
            setGroup(newval);
        },
        setRule: (args) => {
            let current = rule();
            let newval = { ...current, ...args };
            setRule(newval);
        },
        icon,
        setIcon
    }), container);
    confirmDialog({
        title: i18n.bookmark.new,
        content: container,
        width: '800px',
        confirm: () => {
            confirmCb({ group: group(), rule: rule(), icon: icon() });
        }
    });
}
