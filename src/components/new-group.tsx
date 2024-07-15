import { Accessor, createMemo, createSignal, Show } from "solid-js";

import ItemWrap from "@/libs/components/item-wrap";
import InputItem from "@/libs/components/item-input";

import { i18n } from "@/utils/i18n";
import { Transition } from "solid-transition-group";

import { RuleTemplate } from "@/utils/const";

interface IPrpos {
    setGroup: (arg: { name?: string, type?: TBookmarkGroupType }) => void;
    setRule: (arg: { type?: string, input?: string }) => void;
}

const NewGroup = (props: IPrpos) => {
    // let grouptype = 'normal';
    const i18n_ = i18n.newgroup;

    let [groupType, setGroupType] = createSignal("normal");
    let [ruleType, setRuleType] = createSignal("sql");

    let [ruleInput, setRuleInput] = createSignal('');

    let aboutRule = createMemo(() => {
        switch (ruleType()) {
            case 'SQL':
                return {
                    desc: i18n_.desc.sql,
                    direction: "row",
                    input: "textarea"
                }

            case 'backlinks':
                return {
                    desc: i18n_.desc.backlinks,
                    direction: "column",
                    input: "textinput"
                }

            case 'attr':
                return {
                    desc: i18n_.desc.attr,
                    direction: "row",
                    input: "textinput"
                }

            default:
                break;
        }
        return {
            desc: i18n_.desc.sql,
            direction: "row",
            input: "textarea"
        };
    });

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

    const transitionDuration = 100;

    return (
        <div class="config__tab-container fn__flex fn__flex-1 fn__flex-column"
            onkeydown={(e) => {
                if (e.key === 'Enter') {
                    e.stopImmediatePropagation(); // 防止 enter 让 dialog 直接 confirm 了
                }
            }}
        >
            <div style={{ display: "flex", "flex-direction": 'column' }}>
                <ItemWrap
                    title={i18n_.name[0]}
                    description={i18n_.name[1]}
                >
                    <InputItem
                        key="name"
                        value=""
                        type="textinput"
                        changed={(v) => {
                            props.setGroup({ name: v });
                        }}
                    />
                </ItemWrap>
                <ItemWrap
                    title={i18n_.type[0]}
                    description={i18n_.type[1]}
                >
                    <InputItem
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
                </ItemWrap>
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
                    <div style={{ display: "flex", "flex-direction": 'column' }}>
                        <ItemWrap
                            title={i18n_.rtype[0]}
                            description={i18n_.rtype[1]}
                        >
                            <InputItem
                                key="ruleType"
                                value={ruleType()}
                                type="select"
                                options={{
                                    sql: i18n.ruletype.sql,
                                    backlinks: i18n.ruletype.backlinks,
                                    attr: i18n.ruletype.attr,
                                }}
                                changed={(v) => {
                                    props.setRule({ type: v });
                                    setRuleType(v);
                                }}
                            />
                        </ItemWrap>
                        <ItemWrap
                            title={i18n_.rinput}
                            description={aboutRule().desc}
                            //@ts-ignore
                            direction={aboutRule().direction}
                        >
                            <Show when={['sql', 'attr'].includes(ruleType())}>
                                <div style={{
                                    display: "flex",
                                    gap: '10px',
                                    position: 'absolute',
                                    right: '0px',
                                    top: '-60px',
                                    padding: '0px',
                                    margin: 0,
                                    'align-items': 'center'
                                }}>
                                    <span class="b3-label__text">{i18n_.choosetemplate}</span>
                                    <InputItem
                                        key="ruleTemplate"
                                        value={'no'}
                                        options={templateToSelect()}
                                        type='select'
                                        changed={(key) => {
                                            let temp = template()[key].trim();
                                            setRuleInput(temp);
                                            props.setRule({ input: temp });
                                        }}
                                        style={{ 'width': '130px' }}
                                    />
                                </div>
                            </Show>
                            <InputItem
                                key="ruleInput"
                                value={ruleInput()}
                                //@ts-ignore
                                type={aboutRule().input}
                                changed={(v) => {
                                    props.setRule({ input: v });
                                }}
                                style={ruleType() === 'attr' ? { 'flex': 1, 'width': '100%' } : null}
                            />
                        </ItemWrap>
                    </div>
                </Show>
            </Transition>
        </div>
    )
}

export default NewGroup;
