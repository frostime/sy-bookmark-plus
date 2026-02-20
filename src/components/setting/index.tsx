import Form from "@/libs/components/Form";
import GroupList from './group-list';
import { configs, saveConfig, setConfigs } from "@/model";

import { i18n } from "@/utils/i18n";
import { children, Component, For, JSXElement } from "solid-js";
import { useSignalRef } from "@frostime/solid-signal-ref";
import { Dynamic } from "solid-js/web";
import { bookmarkKeymap } from "@/index";
import { disableAutoRefresh, enableAutoRefresh } from "@/model/auto-refresh";
import SubViewList from "./sub-view-list";

interface SettingPanelProps {
    group: string;
    settingItems?: ISettingItem[];
    // display: boolean;
    onChanged?: (e: { group: string, key: string, value: any }) => void;
    children?: JSXElement
}

const SettingPanel: Component<SettingPanelProps> = (props) => {
    // const fn__none = createMemo(() => props.display === true ? "" : "fn__none");
    const useChildren = children(() => props.children);

    return (
        <div class={`config__tab-container`} data-name={props.group}>
            <For each={props.settingItems ?? []}>
                {(item) => (
                    <Form.Wrap
                        title={item.title}
                        description={item.description}
                        direction={item?.direction}
                    >
                        <Form.Input
                            type={item.type}
                            key={item.key}
                            value={item.value}
                            placeholder={item?.placeholder}
                            options={item?.options}
                            slider={item?.slider}
                            button={item?.button}
                            changed={(v) => props.onChanged({ group: props.group, key: item.key, value: v })}
                        />
                    </Form.Wrap>
                )}
            </For>
            {useChildren()}
        </div>
    );
};

const App = () => {
    const i18n_ = i18n.setting;

    const focused = useSignalRef(0);

    const PanelBasic = () => {
        const settingItems: ISettingItem[] = [
            {
                key: 'replaceDefault',
                type: 'checkbox',
                title: i18n_.replaceDefault.title,
                description: i18n_.replaceDefault.description,
                value: configs['replaceDefault']
            },
            {
                key: 'viewMode',
                type: 'select',
                title: i18n_.viewMode.title,
                description: i18n_.viewMode.description,
                value: configs['viewMode'],
                options: {
                    'bookmark': i18n.viewMode.bookmark,
                    'card': i18n.viewMode.card
                }
            },
            {
                key: 'autoRefreshOnExpand',
                type: 'checkbox',
                title: i18n_.autoRefreshOnExpand.title,
                description: i18n_.autoRefreshOnExpand.title,
                value: configs['autoRefreshOnExpand']
            },
            {
                key: 'autoRefreshTemplatingRuleOnSwitchProtyle',
                type: 'checkbox',
                title: i18n.src_components_setting_indextsx.refresh_groups,
                description: i18n.src_components_setting_indextsx.refresh_bookmarks,
                value: configs['autoRefreshTemplatingRuleOnSwitchProtyle']
            },
            {
                key: 'hideClosed',
                type: 'checkbox',
                title: i18n_.hideClosed.title,
                description: i18n_.hideClosed.description,
                value: configs['hideClosed']
            },
            {
                key: 'hideDeleted',
                type: 'checkbox',
                title: i18n_.hideDeleted.title,
                description: i18n_.hideDeleted.description,
                value: configs['hideDeleted']
            },
            {
                key: 'ariaLabel',
                type: 'checkbox',
                title: i18n_.ariaLabel.title,
                description: i18n_.ariaLabel.description,
                value: configs['ariaLabel']
            },
            {
                key: 'zoomInWhenClick',
                type: 'checkbox',
                title: i18n_.zoomInWhenClick.title,
                description: i18n_.zoomInWhenClick.description,
                value: configs['zoomInWhenClick']
            }
        ];

        return (
            <SettingPanel
                group="Basic"
                settingItems={settingItems}
                onChanged={({ key, value }) => {
                    //@ts-ignore
                    setConfigs(key, value);
                    saveConfig();
                    if (key === 'replaceDefault') {
                        if (value) {
                            bookmarkKeymap.replaceDefault();
                        }
                        else {
                            bookmarkKeymap.restoreDefault();
                        }
                    } else if (key === 'autoRefreshTemplatingRuleOnSwitchProtyle') {
                        if (value) {
                            enableAutoRefresh();
                        }
                        else {
                            disableAutoRefresh();
                        }
                    }
                }}
            />
        );
    }

    const PanelGroupList = () => {
        return (
            <SettingPanel
                group="GroupList"
            >
                <GroupList />
            </SettingPanel>
        );
    }

    const groups = {
        [i18n.src_components_setting_indextsx.basic_settings]: PanelBasic,
        [i18n.src_components_setting_indextsx.subview_management]: () => (
            <SettingPanel group="SubViewList">
                <SubViewList></SubViewList>
            </SettingPanel>
        ),
        [i18n.src_components_setting_indextsx.all_bookmark_groups]: PanelGroupList,
    }


    return (
        <div class="fn__flex-1 fn__flex config__panel" style={{ height: "100%" }}>
            <ul class="b3-tab-bar b3-list b3-list--background">
                <For each={Object.keys(groups)}>
                    {(group, i) => (
                        <li
                            class={`b3-list-item${i() === focused() ? " b3-list-item--focus" : ""}`}
                            onClick={() => focused(i())}
                            onKeyDown={() => { }}
                            style={{ 'padding-left': "1rem" }}
                        >
                            <span class="b3-list-item__text">{group}</span>
                        </li>
                    )}
                </For>
            </ul>
            <div class="config__tab-wrap">
                <Dynamic component={groups[Object.keys(groups)[focused()]]} />
            </div>
        </div>
    );
};

export default App;
