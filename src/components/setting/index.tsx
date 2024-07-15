import SettingItemWrap from "@/libs/components/item-wrap";
import InputItem from "@/libs/components/item-input";
import GroupList from './group-list';
import { configs, setConfigs } from "@/model";

import { i18n } from "@/utils/i18n";

const App = () => {
    const i18n_ = i18n.setting;

    return (
        <div class="config__tab-container fn__flex-1" style={{
            'font-size': '1.2rem',
            padding: '10px 20px'
        }}>
            <SettingItemWrap
                title={i18n_.replaceDefault.title}
                description={i18n_.replaceDefault.description}
            >
                <InputItem
                    type="checkbox"
                    key="replaceDefault"
                    value={configs['replaceDefault']}
                    changed={(v) => {
                        setConfigs('replaceDefault', v);
                    }}
                />
            </SettingItemWrap>
            <SettingItemWrap
                title={i18n_.viewMode.title}
                description={i18n_.viewMode.description}
            >
                <InputItem
                    type='select'
                    key='viewMode'
                    value={configs['viewMode']}
                    changed={(v: any) => {
                        setConfigs('viewMode', v);
                    }}
                    options={{
                        'bookmark': i18n.viewMode.bookmark,
                        'card': i18n.viewMode.card
                    }}
                />
            </SettingItemWrap>
            <SettingItemWrap
                title="展开后刷新"
                description="展开一个被折叠的动态组时，自动刷新其中的内容"
            >
                <InputItem
                    type='checkbox'
                    key='autoRefreshOnExpand'
                    value={configs['autoRefreshOnExpand']}
                    changed={(v: any) => {
                        setConfigs('autoRefreshOnExpand', v);
                    }}
                />
            </SettingItemWrap>
            <SettingItemWrap
                title={i18n_.hideClosed.title}
                description={i18n_.hideClosed.description}
            >
                <InputItem
                    type='checkbox'
                    key='hideClosed'
                    value={configs['hideClosed']}
                    changed={(v: any) => {
                        setConfigs('hideClosed', v);
                    }}
                />
            </SettingItemWrap>
            <SettingItemWrap
                title={i18n_.hideDeleted.title}
                description={i18n_.hideDeleted.description}
            >
                <InputItem
                    type='checkbox'
                    key='hideDeleted'
                    value={configs['hideDeleted']}
                    changed={(v: any) => {
                        setConfigs('hideDeleted', v);
                    }}
                />
            </SettingItemWrap>
            <SettingItemWrap
                title={i18n_.grouplist.title}
                description={i18n_.grouplist.description}
                direction="row"
            >
                <GroupList/>
            </SettingItemWrap>
        </div>
    )
}

export default App;
