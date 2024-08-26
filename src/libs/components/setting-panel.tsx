// Copyright (c) 2023 by frostime All Rights Reserved.
// Author       : frostime
// Date         : 2023-07-01 19:23:50
// FilePath     : /src/libs/setting-panel.tsx
// LastEditTime : 2024-06-08 18:25:34
// Description  :

import { Component, For, JSXElement, children } from "solid-js";
import Form from "./Form";

interface SettingPanelProps {
    group: string;
    settingItems: ISettingItem[];
    onChanged: (e: { group: string, key: string, value: any }) => void;
    children?: JSXElement
}

const SettingPanel: Component<SettingPanelProps> = (props) => {
    const useChildren = children(() => props.children);

    return (
        <div class={`config__tab-container`} data-name={props.group}>
            <For each={props.settingItems}>
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

export default SettingPanel;
