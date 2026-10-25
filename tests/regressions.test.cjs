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
    const api = { sql: async (query) => { queries.push(query); return []; } };
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
        '@frostime/siyuan-plugin-kits': {},
        '@/utils/const': { Caret: '‸' },
        './templating': templating,
        siyuan: {},
        '@/utils/i18n': {}
    });
    return { queries, getRule: rules.getRule, setActiveDoc: (id) => { activeDoc = id; } };
}

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

test('restored Dock cannot initialize until saved bookmark data has loaded', async () => {
    let finishLoad;
    let loaded = false;
    const loadBarrier = new Promise((resolve) => { finishLoad = resolve; });
    const initializedWithData = [];
    class HostPlugin {
        addIcons() {}
        addDock(options) {
            // SiYuan may immediately restore a previously open Dock.
            options.init.call({ data: options.data, element: {} });
        }
    }
    const model = {
        async load() {
            await loadBarrier;
            loaded = true;
        }
    };
    const pluginModule = loadSource('src/index.ts', {
        siyuan: { Plugin: HostPlugin },
        './libs/dialog': {},
        './model': { getModel: () => model, configs: { replaceDefault: false }, subViews: () => ({}), configRef: () => ({}) },
        './components/setting': {},
        '@/utils/style': {},
        '@/utils/const': { Svg: {} },
        '@/utils/i18n': { setI18n() {} },
        '@/index.scss': {},
        './utils': {},
        './sdk': { loadSdk() {} },
        '@frostime/siyuan-plugin-kits': { registerPlugin() {} },
        './model/auto-refresh': {},
        './dock-views': {
            registerDockViewTypeName() {},
            getDockViewTypeName: (id) => id,
            initBookmark() { initializedWithData.push(loaded); }
        }
    }, { window: { siyuan: { config: { keymap: { general: { bookmark: {} } } } } } });
    const plugin = new pluginModule.default();
    const pendingLoad = plugin.onload();
    try {
        assert.equal(initializedWithData.length, 0);
    } finally {
        finishLoad();
        await pendingLoad;
    }
    assert.deepEqual(initializedWithData, [true]);
});
