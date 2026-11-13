const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const ts = require('typescript');
const solid = require('solid-js');
const store = require('solid-js/store');
const refs = require('@frostime/solid-signal-ref');

const root = resolve(__dirname, '..');
function loadSource(file, dependencies, globals) {
    const { outputText } = ts.transpileModule(readFileSync(resolve(root, file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    });
    const exports = {};
    // Solid checks object prototypes when wrapping stores. Keep source objects and
    // the real reactive runtime in one realm, with explicit external dependencies.
    const context = {
        exports, console, ...globals,
        require(id) {
            assert.ok(Object.hasOwn(dependencies, id), `${file}: unexpected dependency ${id}`);
            return dependencies[id];
        }
    };
    Function(...Object.keys(context), outputText)(...Object.values(context));
    return exports;
}

// Production model, stores, rules, Dock manager and debounce; host, I/O and JSX are substitutes.
function environment({ mount = false, legacy = false, mobile = false, noDocks = false, cachedDocks = {} } = {}) {
    let plugin;
    let beforeRead = async () => {};
    let beforeQuery = async () => {};
    let beforeWrite = async () => {};
    let ruleQuery = async () => [];
    const disk = {
        'bookmarks.json': { schema: '3.0', groups: {}, defaultView: { groups: [] } },
        'bookmark-sub-views.json': {},
        'bookmark-configs.json': { replaceDefault: false },
        'bookmark-items-snapshot.json': {}
    };
    const reads = [], cachedReads = [], writes = [], queries = [], ruleQueries = [];
    const notices = [], errors = [], removed = [], disposed = [];
    const readFailures = new Map(), blockTitles = new Map();
    const timers = new Map(), icons = new Map(), styles = new Map(), listeners = new Set(), dockOptions = new Map();
    const events = { on: 0, off: 0 };
    const i18n = {
        itemErr: { closed: 'closed', deleted: 'deleted' },
        msg: { ruleInvalid: 'invalid rule', ruleFailed: 'rule failed' },
        sync: { readFailed: 'Storage read failed; saving paused', retry: 'Retry', loading: 'Loading storage', conflictTitle: 'Do not edit on multiple devices', conflictBody: 'No fine-grained merge. Unsaved edits are discarded. Wait for sync before switching devices.', acknowledge: 'I understand' }
    };
    const element = () => ({
        children: [], style: {}, attributes: {}, classList: { add() {}, contains: () => false },
        append(...nodes) { for (const node of nodes) { node.parent = this; this.children.push(node); } },
        appendChild(node) { this.append(node); return node; },
        replaceChildren(...nodes) { this.children = []; this.append(...nodes); },
        remove() { if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this); },
        setAttribute(key, value) { this.attributes[key] = value; },
        addEventListener(event, fn) { this[event] = fn; },
        querySelector: () => null
    });
    const dialogs = [];
    class Dialog {
        constructor(options) {
            this.options = options;
            this.element = element();
            this.buttons = [element(), element()];
            this.body = element();
            this.input = { ...element(), value: '' };
            this.element.querySelector = selector => selector === 'button' ? this.buttons[0]
                : selector === 'textarea, input' ? this.input : this.body;
            this.element.querySelectorAll = () => this.buttons;
            dialogs.push(this);
        }
        destroy() {
            if (this.destroyed) return;
            this.destroyed = true;
            this.options.destroyCallback?.();
        }
    }
    const mobileElement = element();
    let mobileCustom;
    let nextTimer = 0;
    const globals = {
        AbortController,
        console: { ...console, error: (...args) => errors.push(args) },
        window: { siyuan: {
            notebooks: [{ id: 'box', name: 'Notebook' }],
            languages: { cancel: 'Cancel', confirm: 'Confirm' },
            config: { keymap: { general: { bookmark: { default: '⌥B', custom: '⌥B' } } }, uiLayout: {} },
            storage: { 'host-dock-cache': { 'sy-bookmark-plus': cachedDocks } },
            mobile: { docks: {} },
            layout: { leftDock: { data: {}, remove(key) {
                removed.push(key); icons.delete(key); delete this.data[key];
            } } }
        } },
        document: {
            querySelector(selector) {
                const type = selector.match(/data-type="([^"]+)"/)?.[1];
                if (type) return icons.get(type) ?? null;
                return styles.get(selector.match(/style#(.+)/)?.[1]) ?? null;
            },
            getElementById: (id) => styles.get(id),
            createElement() {
                const node = element();
                const remove = node.remove.bind(node);
                node.remove = () => { styles.delete(node.id); remove(); };
                return node;
            },
            head: { appendChild(node) { styles.set(node.id, node); } }
        },
        setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; },
        clearTimeout(id) { timers.delete(id); },
        async fetch(url, options) {
            assert.equal(url, '/api/file/getFile');
            const path = JSON.parse(options.body).path;
            assert.ok(path.startsWith('/data/storage/petal/sy-bookmark-plus/'));
            const file = path.split('/').at(-1);
            reads.push(file);
            const value = structuredClone(disk[file]);
            await beforeRead(file);
            if (readFailures.has(file)) return { status: readFailures.get(file), json: async () => ({ code: -1, msg: 'read failed' }) };
            return value === undefined
                ? { status: 202, json: async () => ({ code: 404, msg: 'not found' }) }
                : { status: 200, json: async () => value };
        }
    };
    const performance = loadSource('node_modules/@frostime/siyuan-plugin-kits/dist/performance.mjs', {}, globals);
    const hostDialogs = loadSource('node_modules/@frostime/siyuan-plugin-kits/dist/dialog.mjs', { siyuan: { Dialog } }, globals);
    const kits = { ...performance, ...hostDialogs, thisPlugin: () => plugin, isMobile: () => mobile, registerPlugin() {} };
    const solidWeb = { render(factory, target) {
        const id = factory(); target.content = id;
        return () => { disposed.push(id); target.content = undefined; };
    } };
    const dialogModule = loadSource('src/libs/dialog.ts', {
        siyuan: { Dialog }, 'solid-js': solid, 'solid-js/web': solidWeb, '@frostime/siyuan-plugin-kits': kits
    }, globals);
    const api = { sql: async query => { ruleQueries.push(query); return await ruleQuery(query); } };
    const utils = loadSource('src/utils/index.ts', { siyuan: { getFrontend: () => mobile ? 'mobile' : 'desktop' }, '../api': api }, globals);
    const dockModule = {}, autoRefresh = {};
    const storage = loadSource('src/model/storage.ts', {
        '@frostime/siyuan-plugin-kits': kits, '../utils': utils
    }, globals);
    const storageRefresh = loadSource('src/storage-refresh.ts', {
        siyuan: { Dialog }, './model/storage': storage,
        './libs/dialog': dialogModule, './model/auto-refresh': autoRefresh, './dock-views': dockModule
    }, globals);
    const stores = loadSource('src/model/stores.ts', {
        'solid-js': solid, 'solid-js/store': store, './storage': storage,
        '@frostime/solid-signal-ref': refs
    }, globals);
    const messages = { i18n, renderI18n: (text) => text };
    const hostApi = { showMessage: message => notices.push(message) };
    const rules = loadSource('src/model/rules.ts', {
        '@/api': api, '@/libs/query': {}, '@/utils/const': { Caret: '‸' },
        './templating': loadSource('src/model/templating.ts', { '@/utils': utils }, globals),
        '@frostime/siyuan-plugin-kits': kits, siyuan: hostApi, '@/utils/i18n': messages
    }, globals);
    const modelModule = loadSource('src/model/index.ts', {
        './stores': stores, 'solid-js': solid, 'solid-js/store': store, '@/utils': utils, './storage': storage,
        './data': {
            async getBlocks(ids) {
                queries.push([...ids]);
                const blocks = Object.fromEntries(ids.map(id => [id, { id, type: 'p', box: 'box', content: blockTitles.get(id) ?? `Kernel ${id}` }]));
                await beforeQuery(ids);
                return blocks;
            },
            async getDocInfos() { return {}; }
        },
        '../libs/op': loadSource('src/libs/op.ts', {}, globals), './rules': rules,
        './utils': loadSource('src/model/utils.ts', {}, globals),
        './migration': loadSource('src/model/migration.ts', {}, globals),
        '@frostime/siyuan-plugin-kits': kits, siyuan: hostApi, '@/utils/i18n': messages
    }, globals);
    Object.assign(dockModule, loadSource('src/dock-views.ts', {
        'solid-js/web': solidWeb, './utils/i18n': messages,
        '@frostime/siyuan-plugin-kits': kits,
        './components/bookmark': props => props.sourceView,
        './model': modelModule,
        siyuan: { Constants: { LOCAL_PLUGIN_DOCKS: 'host-dock-cache' } }
    }, globals));
    Object.assign(autoRefresh, loadSource('src/model/auto-refresh.ts', {
        '@frostime/siyuan-plugin-kits': kits, '.': modelModule
    }, globals));
    class HostPlugin {
        name = 'sy-bookmark-plus';
        i18n = i18n;
        docks = {};
        commands = [];
        eventBus = {
            on(_event, handler) { events.on++; listeners.add(handler); },
            off(_event, handler) { events.off++; listeners.delete(handler); }
        };
        addIcons() {}
        addCommand(command) { command.customHotkey = '⌥X'; this.commands.push(command); }
        async loadData(file) { cachedReads.push(file); return structuredClone(disk[file]); }
        async saveData(file, value) {
            const data = JSON.parse(JSON.stringify(value));
            writes.push({ file, data });
            await beforeWrite(file);
            disk[file] = data;
        }
        addDock(options) {
            if (noDocks) return;
            const key = this.name + options.type;
            dockOptions.set(key, options);
            const attrs = { 'data-type': key };
            icons.set(key, {
                attrs, classList: { contains: () => false, add() {} },
                setAttribute(name, value) { attrs[name] = value; },
                querySelector: () => ({ setAttribute(name, value) { attrs[name] = value; } }),
                remove() { icons.delete(key); }
            });
            this.docks[key] = { id: options.type, config: legacy && cachedDocks[key] ? { ...cachedDocks[key] } : options.config };
            if (mount && !mobile) {
                globals.window.siyuan.layout.leftDock.data[key] = {};
                options.init.call({ data: options.data, element: element() });
            }
            return this.docks[key];
        }
        removeDock(id) {
            const key = this.name + id;
            removed.push(key); icons.delete(key); delete this.docks[key];
        }
    }
    const pluginModule = loadSource('src/index.ts', {
        siyuan: { Plugin: HostPlugin, ...hostApi },
        './libs/dialog': dialogModule, './model': modelModule, './components/setting': {}, './storage-refresh': storageRefresh,
        '@/utils/style': loadSource('src/utils/style.ts', {}, globals),
        '@/utils/const': { Svg: {} }, '@/utils/i18n': { setI18n() {} }, '@/index.scss': {}, './utils': utils,
        './sdk': { loadSdk() {}, unloadSdk() {} },
        '@frostime/siyuan-plugin-kits': kits, './model/auto-refresh': autoRefresh, './dock-views': dockModule
    }, globals);
    plugin = new pluginModule.default();
    if (legacy) plugin.removeDock = undefined;
    return {
        plugin, model: () => modelModule.getModel(), stores, disk, reads, cachedReads, writes, dialogs, dialogModule, dockModule,
        storage: storage.bookmarkStorage,
        queries, ruleQueries, notices, errors, icons, styles, readFailures, blockTitles,
        listeners, events, removed, disposed, window: globals.window,
        mountNewDocks(value) { mount = value; },
        beforeRead(fn) { beforeRead = fn; }, beforeQuery(fn) { beforeQuery = fn; },
        beforeWrite(fn) { beforeWrite = fn; }, ruleQuery(fn) { ruleQuery = fn; },
        async flushSaves() {
            for (const [id, timer] of timers) {
                if (timer.delay > 2000) continue;
                timers.delete(id); timer.fn(); await new Promise(setImmediate);
            }
        },
        openMobileDock(key) {
            // SiYuan 3.8.0 openDockMenu keeps this reference separately from mobile.docks.
            if (mobileCustom?.type === key) return;
            mobileCustom?.destroy?.();
            const options = dockOptions.get(key);
            mobileCustom = { type: key, data: options.data, element: mobileElement, destroy: options.destroy };
            globals.window.siyuan.mobile.docks[key] = mobileCustom;
            options.init.call(mobileCustom);
        },
        fireTimeouts() {
            for (const [id, timer] of [...timers]) {
                if (timer.delay !== 15000) continue;
                timers.delete(id); timer.fn();
            }
        },
        mobileContent: () => mobileElement.children.find(node => node.content)?.content,
        settle: () => new Promise(setImmediate)
    };
}

const group = (id, items = []) => ({ id, name: id, type: 'normal', items: items.map(id => ({ id })) });
const view = (name, groups = [], extra = {}) => ({ name, groups, dockPosition: 'RightBottom', ...extra });
const barrier = () => {
    let release;
    const promise = new Promise(resolve => { release = resolve; });
    return { promise, release };
};
module.exports = { environment, group, view, barrier, loadSource };
