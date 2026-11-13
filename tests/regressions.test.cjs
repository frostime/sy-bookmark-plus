const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const projectRoot = resolve(__dirname, '..');

// Execute the production TS without loading SiYuan or touching plugin storage.
function loadSource(file, dependencies, globals = {}) {
    const source = readFileSync(resolve(projectRoot, file), 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    });
    const exports = {};
    runInNewContext(outputText, {
        exports,
        console,
        ...globals,
        require(id) {
            assert.ok(Object.hasOwn(dependencies, id), `Unexpected dependency: ${id}`);
            return dependencies[id];
        }
    }, { filename: file });
    return exports;
}

function ruleEnvironment() {
    let activeDoc;
    const queries = [];
    const blockTable = {};
    let sqlResult = [];
    const api = { sql: async (query) => { queries.push(query); return sqlResult; } };
    // `id2block` 查询 `where id in (...)`, 内核按主键索引顺序返回, 排开了传入的 id 顺序
    const kits = {
        id2block: async (ids) => ids.map((id) => blockTable[id]).filter(Boolean)
            .sort((a, b) => a.id.localeCompare(b.id))
    };
    const document = {
        querySelector(selector) {
            if (!activeDoc) return null;
            if (selector === 'ul.layout-tab-bar>li.item--focus') {
                return { getAttribute: () => 'active-tab' };
            }
            if (selector === 'div.protyle[data-id="active-tab"] .protyle-title') {
                return { getAttribute: () => activeDoc };
            }
            return null;
        }
    };
    const utils = loadSource('src/utils/index.ts', { siyuan: {}, '../api': api }, { document });
    const templating = loadSource('src/model/templating.ts', { '@/utils': utils });
    const rules = loadSource('src/model/rules.ts', {
        '@/api': api,
        '@/libs/query': {},
        '@frostime/siyuan-plugin-kits': kits,
        '@/utils/const': { Caret: '‸' },
        './templating': templating,
        siyuan: {},
        '@/utils/i18n': {}
    });
    return {
        queries,
        getRule: rules.getRule,
        setActiveDoc: (id) => { activeDoc = id; },
        setSqlResult: (rows) => { sqlResult = rows; },
        setBlocks: (list) => { for (const block of list) blockTable[block.id] = block; }
    };
}

const iconValues = loadSource('src/components/elements/group-icon-value.ts', {}, { URLSearchParams });

test('editing a dynamic text icon preserves kernel parameters and encoded text', () => {
    const original = iconValues.readDynamicIcon({ type: 'img', value:
        'api/icon/getDynamicIcon?type=8&content=old?text&color=%233575f0&lang=zh-CN&id=block-id&_fontRefresh=1' });
    assert.equal(original.get('content'), 'old?text');
    const icon = iconValues.buildDynamicIcon(original, { type: '8', color: '#d23f31', text: '工 & TODO?' });
    const restored = iconValues.readDynamicIcon(icon);
    assert.equal(restored.get('content'), '工 & TODO?');
    assert.equal(restored.get('color'), '#d23f31');
    assert.equal(restored.get('lang'), 'zh-CN');
    assert.equal(restored.get('id'), 'block-id');
    assert.equal(restored.has('_fontRefresh'), false);
});

test('a fixed date survives editing unless the user clears it to follow today', () => {
    const original = iconValues.readDynamicIcon({ type: 'img', value:
        '/api/icon/getDynamicIcon?type=7&date=2030-01-02&weekdayType=3' });
    const options = { type: '1', color: '#3575f0', text: '' };
    const unchangedDate = iconValues.readDynamicIcon(iconValues.buildDynamicIcon(original, options));
    assert.equal(unchangedDate.get('date'), '2030-01-02');
    assert.equal(unchangedDate.get('weekdayType'), '3');
    const today = iconValues.readDynamicIcon(iconValues.buildDynamicIcon(original, { ...options, date: '' }));
    assert.equal(today.has('date'), false);
});

test('ordinary images and unknown dynamic types are not reinterpreted as editable date icons', () => {
    for (const value of ['https://example.com/icon.png', 'data:image/png;base64,AA==', 'api/icon/getDynamicIcon?type=9']) {
        assert.equal(iconValues.readDynamicIcon({ type: 'img', value }), null);
    }
});

const documentRules = [
    ['sql', "select * from blocks where root_id = '{{CurDocId}}'"],
    ['backlinks', '{{CurRootId}}'],
    ['attr', 'custom-target={{CurDocId}}'],
    ['attr', 'custom-{{CurRootId}}'],
    ['js', 'return kit.sql("select * from blocks where root_id = \'{{CurDocId}}\'");']
];

for (const [type, input] of documentRules) {
    test(`${type}: unresolved document variable must not execute a query (${input})`, async () => {
        const env = ruleEnvironment();
        const rule = env.getRule({ type, input });
        assert.equal(rule.validateInput(), true);
        assert.equal((await rule.fetch()).length, 0);
        assert.equal(env.queries.length, 0);

        const docId = '20261025120000-abcdefg';
        env.setActiveDoc(docId);
        await rule.fetch();
        assert.equal(env.queries.length, 1);
        assert.ok(env.queries[0].includes(docId));
        if (type === 'attr' && input.startsWith('custom-target=')) {
            assert.ok(env.queries[0].includes(`AND A.value = '${docId}'`));
        }
    });
}

test('attribute rule without a value still queries by name when no document is open', async () => {
    const env = ruleEnvironment();
    const rule = env.getRule({ type: 'attr', input: 'custom-target' });
    assert.equal(rule.validateInput(), true);
    await rule.fetch();
    assert.equal(env.queries.length, 1);
    assert.ok(env.queries[0].includes("A.name like 'custom-target'"));
    assert.ok(!env.queries[0].includes('AND A.value'));
});

test('js rule keeps the script order of the returned block ids', async () => {
    const env = ruleEnvironment();
    // 故意不是 id 升序
    const ids = ['20260101000000-aaaaaaa', '20251231000000-bbbbbbb', '20251101000000-ccccccc'];
    env.setBlocks(ids.map((id) => ({ id })));
    const rule = env.getRule({ type: 'js', input: `return ${JSON.stringify(ids)};` });
    const fetched = await rule.fetch();
    // 展开到测试本域的数组, 避免与 vm 里构造的数组做跨 realm 比较
    assert.deepEqual([...fetched.map((b) => b.id)], ids);
});

test('js rule returns each block once in first-occurrence order', async () => {
    const env = ruleEnvironment();
    const first = '20260101000000-aaaaaaa';
    const second = '20251231000000-bbbbbbb';
    env.setBlocks([{ id: first }, { id: second }]);
    const rule = env.getRule({ type: 'js', input: `return ${JSON.stringify([first, second, first])};` });
    const fetched = await rule.fetch();
    assert.deepEqual([...fetched.map((block) => block.id)], [first, second]);
});

test('backlinks b2doc keeps the updated-desc order instead of the kernel id order', async () => {
    const env = ruleEnvironment();
    env.setSqlResult([
        { id: '20260101000000-aaaaaaa', root_id: '20250101000000-yyyyyyy' },
        { id: '20251231000000-bbbbbbb', root_id: '20241231000000-zzzzzzz' }
    ]);
    env.setBlocks([{ id: '20241231000000-zzzzzzz' }, { id: '20250101000000-yyyyyyy' }]);
    const rule = env.getRule({ type: 'backlinks', input: '20250101000000-xxxxxxx\u2038b2doc' });
    const fetched = await rule.fetch();
    assert.deepEqual([...fetched.map((b) => b.id)], ['20250101000000-yyyyyyy', '20241231000000-zzzzzzz']);
});

test('per-group doc-switch refresh mode: off > on > default(follow global)', () => {
    const state = { autoRefreshTemplatingRuleOnSwitchProtyle: false };
    const mod = loadSource('src/model/auto-refresh.ts', {
        '@frostime/siyuan-plugin-kits': { thisPlugin: () => undefined },
        '.': { configs: state, getModel: () => undefined }
    });
    const isRefresh = mod.isRefreshOnDocSwitch;
    const docVarGroup = (mode) => ({
        type: 'dynamic',
        rule: { type: 'sql', input: 'select * from blocks where root_id = "{{CurDocId}}"' },
        refreshOnDocSwitch: mode
    });

    state.autoRefreshTemplatingRuleOnSwitchProtyle = false;
    assert.equal(isRefresh(docVarGroup(undefined)), false); // default 遵循全局, 全局关
    assert.equal(isRefresh(docVarGroup('default')), false);
    assert.equal(isRefresh(docVarGroup('on')), true);      // on 不看全局开关
    assert.equal(isRefresh(docVarGroup('off')), false);    // off 优先级最高

    state.autoRefreshTemplatingRuleOnSwitchProtyle = true;
    assert.equal(isRefresh(docVarGroup('default')), true); // 含文档模板变量
    assert.equal(isRefresh(docVarGroup('on')), true);
    assert.equal(isRefresh(docVarGroup('off')), false);

    // default 档但规则不含文档变量 → 不随切换刷新
    const noVar = { type: 'dynamic', rule: { type: 'js', input: 'return kit.sql("select 1");' } };
    assert.equal(isRefresh(noVar), false);
});

test('document switches refresh each referenced dynamic group once, including migrated subview-only groups', async () => {
    const { environment, view } = require('./storage-refresh-environment.cjs');
    const env = environment();
    const dynamic = (id, extra = {}) => ({
        id, name: id, type: 'dynamic', items: [], hidden: true,
        refreshOnDocSwitch: 'on', rule: { type: 'sql', input: `select * from blocks /* ${id} */` }, ...extra
    });
    const groups = ['shared', 'subview-only', 'hidden-view-only', 'unreferenced', 'off'].map(id => dynamic(id));
    groups.find(group => group.id === 'off').refreshOnDocSwitch = 'off';
    env.disk['bookmarks.json'] = {
        schema: '2.0', groups: Object.fromEntries(groups.map(group => [group.id, group])),
        defaultView: { groups: ['shared', 'off'] }
    };
    env.disk['bookmark-sub-views.json'] = {
        visible: view('Visible', ['shared', 'subview-only', 'off']),
        another: view('Another', ['subview-only']),
        hidden: view('Hidden', ['hidden-view-only'], { hidden: true })
    };
    await env.plugin.onload();
    assert.equal(env.stores.configs.autoRefreshTemplatingRuleOnSwitchProtyle, false);
    for (const handler of env.listeners) handler();
    await env.settle();
    assert.deepEqual(env.ruleQueries, [
        'select * from blocks /* shared */',
        'select * from blocks /* subview-only */'
    ]);
    assert.equal(env.stores.subViews().hidden.hidden, true);
    env.plugin.onunload();
});

test('creating groups leaves view membership to the caller and never saves group.hidden', async () => {
    const { environment } = require('./storage-refresh-environment.cjs');
    const env = environment();
    await env.plugin.onload();
    let nextId = 0;
    env.window.Lute = { NewNodeID: () => `created-${++nextId}` };
    const first = env.model().newGroup('Default group', 'normal');
    const second = env.model().newGroup('Subview group', 'normal');
    assert.deepEqual(env.stores.defaultView().groups, []);
    env.model().addGroupToDefaultView(first.id);
    env.stores.subViews.update({ custom: { id: 'custom', name: 'Custom', groups: [second.id], expand: {} } });
    await env.flushSaves();
    assert.equal(env.disk['bookmarks.json'].schema, '2.1');
    assert.deepEqual(env.disk['bookmarks.json'].defaultView.groups, [first.id]);
    assert.deepEqual(env.disk['bookmark-sub-views.json'].custom.groups, [second.id]);
    for (const group of Object.values(env.disk['bookmarks.json'].groups)) {
        assert.equal(Object.hasOwn(group, 'hidden'), false);
    }
    env.plugin.onunload();
});

test('SDK group queries do not expose a hidden property', () => {
    const sdkModule = loadSource('src/sdk.ts', {
        './model/stores': { groups: [{ id: 'a', name: 'A', type: 'normal', items: [] }], itemInfo: {} }
    }, { globalThis });
    sdkModule.loadSdk();
    try {
        assert.equal(Object.hasOwn(globalThis.BookmarkPlusSDK.listGroups()[0], 'hidden'), false);
        assert.equal(Object.hasOwn(globalThis.BookmarkPlusSDK.findGroup('A'), 'hidden'), false);
    } finally {
        sdkModule.unloadSdk();
    }
});

test('restored Dock cannot initialize until saved bookmark data has loaded', async () => {
    const { environment, group, barrier } = require('./storage-refresh-environment.cjs');
    const env = environment({ mount: true });
    env.disk['bookmarks.json'] = { schema: '2.1', groups: { g: group('g') }, defaultView: { groups: ['g'] } };
    const read = barrier();
    env.beforeRead(() => read.promise);
    const pendingLoad = env.plugin.onload();
    await env.settle();
    assert.deepEqual(Object.keys(env.plugin.docks), []);
    assert.deepEqual(Object.keys(env.dockModule.disposers._disposer), []);
    read.release();
    await pendingLoad;
    assert.equal(env.stores.groups[0].id, 'g');
    assert.deepEqual(Object.keys(env.dockModule.disposers._disposer), ['DEFAULT']);
});
