const assert = require('node:assert/strict');
const { test } = require('node:test');
const { environment, group, view, barrier } = require('./storage-refresh-environment.cjs');

function archive(env, groups, views = {}, config = { replaceDefault: false }) {
    env.disk['bookmarks.json'] = { schema: '3.0', groups: Object.fromEntries(groups.map(group => [group.id, group])), defaultView: { groups: groups.map(group => group.id) } };
    env.disk['bookmark-sub-views.json'] = views;
    env.disk['bookmark-configs.json'] = config;
}

function warningDialogs(env) { return env.dialogs.filter(dialog => dialog.options.title === 'Do not edit on multiple devices'); }

test('a notification replaces all four files, deletes removed views/fields, and does not duplicate references', async () => {
    const env = environment();
    archive(env, [group('old', ['a'])], { removed: view('Removed'), retained: view('Old', ['old'], { icon: { type: 'symbol', value: 'iconStar' } }) }, { replaceDefault: false, hideDeleted: false });
    await env.plugin.onload();
    archive(env, [group('new', ['shared']), group('second', ['shared'])], { retained: view('Renamed', ['new']) });
    env.disk['bookmark-items-snapshot.json'] = { shared: { title: 'Cached title', box: 'closed-box', type: 'd', icon: 'iconBook' } };
    await env.plugin.onDataChanged();
    await env.plugin.onDataChanged();
    assert.deepEqual(env.stores.groups.map(group => group.id), ['new', 'second']);
    assert.deepEqual(env.stores.defaultView().groups, ['new', 'second']);
    assert.deepEqual(Object.keys(env.stores.itemInfo), ['shared']);
    assert.equal(env.stores.itemInfo.shared.ref, 2);
    assert.equal(env.stores.itemInfo.shared.title, 'Cached title');
    assert.equal(env.stores.itemInfo.shared.box, 'closed-box');
    assert.equal(env.stores.subViews().removed, undefined);
    assert.equal(env.stores.subViews().retained.icon, undefined);
    assert.equal(env.stores.subViews().retained.name, 'Renamed');
    assert.equal(env.stores.configs.hideDeleted, true);
    assert.equal(env.cachedReads.length, 0);
    assert.equal(env.queries.length, 0, 'unopened Docks must not start metadata queries');
    await env.flushSaves();
    assert.equal(env.writes.length, 0);
    assert.equal(warningDialogs(env).length, 0, 'quiet single-device refresh must not warn');
});

test('bursts of notifications share a task and reread before committing a superseded read', async () => {
    const env = environment();
    await env.plugin.onload();
    archive(env, [group('intermediate')]);
    const read = barrier();
    env.beforeRead(() => read.promise);
    const first = env.plugin.onDataChanged();
    await env.settle();
    archive(env, [group('latest')]);
    assert.equal(env.plugin.onDataChanged(), first);
    read.release();
    await first;
    assert.deepEqual(env.stores.groups.map(group => group.id), ['latest']);
    assert.equal(warningDialogs(env).length, 0);
});

test('an overlapping deferred save is discarded and produces one explicit merge warning Dialog', async () => {
    const env = environment();
    archive(env, [group('g')]);
    await env.plugin.onload();
    env.model().renameGroup('g', 'Unsaved local edit');
    archive(env, [{ ...group('g'), name: 'Stored remote edit' }]);
    await env.plugin.onDataChanged();
    await env.flushSaves();
    assert.equal(env.stores.groups[0].name, 'Stored remote edit');
    assert.equal(env.writes.length, 0);
    const warnings = warningDialogs(env);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0].options.content, /No fine-grained merge/);
    assert.match(warnings[0].options.content, /I understand/);
    await env.plugin.onDataChanged();
    assert.equal(warningDialogs(env).length, 1, 'the warning is not itself a pending editor');
    warnings[0].buttons[0].click();
    assert.equal(warnings[0].destroyed, true);
});

test('owned editors and confirmations close without submitting drafts, releasing their Solid roots', async () => {
    const env = environment();
    archive(env, [group('g')]);
    await env.plugin.onload();
    let committed = 0, disposed = 0;
    const settings = env.dialogModule.solidDialog({ title: 'Settings', loader: () => 'settings-root', callback: () => { committed++; } });
    const editor = env.dialogModule.confirmDialog({ title: 'Edit group', content: '', confirm: () => { committed++; }, destroyCallback: () => { disposed++; } });
    const input = env.dialogModule.inputDialog({ title: 'View name', confirm: () => { committed++; } });
    env.dialogModule.confirm('Delete group', 'Are you sure?', () => { committed++; });
    await env.plugin.onDataChanged();
    assert.equal(settings.dialog.destroyed, true);
    assert.equal(editor.destroyed, true);
    assert.equal(input.dialog.destroyed, true);
    assert.equal(env.dialogModule.openDialogCount(), 0);
    assert.equal(committed, 0);
    assert.equal(disposed, 1);
    assert.ok(env.disposed.includes('settings-root'));
    assert.equal(warningDialogs(env).length, 1);
    const normal = env.dialogModule.solidDialog({ title: 'Settings', loader: () => 'normal', callback: () => { committed++; } });
    normal.close();
    assert.equal(committed, 1, 'normal closing still saves settings');
});

test('failed reads keep the displayed data and block saves until manual retry succeeds', async () => {
    const env = environment({ mount: true });
    archive(env, [group('old', ['old-item'])]);
    await env.plugin.onload();
    await env.settle();
    const previous = env.stores.groups[0];
    const oldDisposals = env.disposed.length;
    archive(env, [group('new', ['new-item'])]);
    env.readFailures.set('bookmark-items-snapshot.json', 500);
    await env.plugin.onDataChanged();
    assert.equal(env.stores.groups[0], previous);
    assert.equal(env.disposed.length, oldDisposals);
    const content = env.dockModule.disposers._ele.DEFAULT.children.find(node => node.content === 'DEFAULT');
    assert.equal(content.inert, true);
    const status = env.dockModule.disposers._ele.DEFAULT.children.find(node => node.attributes.role === 'status');
    assert.equal(status.children[0].textContent, 'Storage read failed; saving paused');
    env.model().save();
    env.stores.saveConfig();
    await env.stores.saveSubViews();
    await env.flushSaves();
    assert.equal(env.writes.length, 0);
    env.readFailures.clear();
    const retry = status.children[1];
    retry.click();
    await env.plugin.onDataChanged();
    assert.deepEqual(env.stores.groups.map(group => group.id), ['new']);
    assert.ok(env.disposed.includes('DEFAULT'));
    const replacement = env.dockModule.disposers._ele.DEFAULT.children.find(node => node.content === 'DEFAULT');
    assert.equal(replacement.inert, false);
});

test('first-load failure shows a retry state and the next notification recovers', async () => {
    const env = environment({ mount: true });
    archive(env, [group('g')]);
    env.readFailures.set('bookmarks.json', 202);
    await env.plugin.onload();
    assert.equal(env.stores.groups.length, 0);
    assert.equal(env.dockModule.disposers._ele.DEFAULT.children[0].children[1].textContent, 'Retry');
    await env.flushSaves();
    assert.equal(env.writes.length, 0, 'an error response must not be migrated into an empty archive');
    env.readFailures.clear();
    await env.plugin.onDataChanged();
    assert.equal(env.stores.groups[0].id, 'g');
});

test('a missing archive is not automatically written back as an empty migrated archive', async () => {
    const env = environment();
    delete env.disk['bookmarks.json'];
    await env.plugin.onload();
    await env.flushSaves();
    assert.equal(env.stores.groups.length, 0);
    assert.equal(env.writes.length, 0);
});

test('known missing files use defaults, while old schemas still migrate and save normally', async () => {
    const env = environment();
    env.disk['bookmarks.json'] = { old: group('old') };
    delete env.disk['bookmark-sub-views.json'];
    delete env.disk['bookmark-configs.json'];
    delete env.disk['bookmark-items-snapshot.json'];
    await env.plugin.onload();
    assert.deepEqual(env.stores.defaultView().groups, ['old']);
    await env.flushSaves();
    assert.equal(env.disk['bookmarks.json'].schema, '3.0');
    assert.deepEqual(env.disk['bookmarks.json'].defaultView.groups, ['old']);
});

test('2.0 migration saves 3.0 once without changing view membership or subview hiding', async () => {
    const env = environment();
    archive(env, [{ ...group('a'), hidden: true }, { ...group('b'), hidden: false }], {
        custom: view('Hidden subview', ['b', 'a'], { hidden: true })
    });
    env.disk['bookmarks.json'].schema = '2.0';
    env.disk['bookmarks.json'].defaultView.groups = ['a'];
    await env.plugin.onload();
    assert.deepEqual(env.stores.defaultView().groups, ['a']);
    for (const group of env.stores.groups) assert.equal(Object.hasOwn(group, 'hidden'), false);
    await env.flushSaves();
    assert.equal(env.disk['bookmarks.json'].schema, '3.0');
    assert.deepEqual(env.disk['bookmarks.json'].defaultView.groups, ['a']);
    assert.deepEqual(env.disk['bookmark-sub-views.json'].custom.groups, ['b', 'a']);
    assert.equal(env.disk['bookmark-sub-views.json'].custom.hidden, true);
    const writes = env.writes.length;
    await env.plugin.onDataChanged();
    await env.flushSaves();
    assert.equal(env.writes.length, writes, 'reloading a migrated archive must not schedule another migration save');
});

test('unsupported or invalid schemas keep displayed data and never overwrite the rejected archive', async () => {
    const env = environment();
    archive(env, [group('retained')]);
    await env.plugin.onload();
    const displayed = env.stores.groups[0];
    for (const rejected of [
        { schema: '4.0', groups: {}, defaultView: { groups: [] } },
        { schema: '3.0', groups: { bad: { ...group('bad'), hidden: false } }, defaultView: { groups: ['bad'] } }
    ]) {
        env.disk['bookmarks.json'] = rejected;
        await env.plugin.onDataChanged();
        assert.equal(env.stores.groups[0], displayed);
        env.model().save();
        await env.flushSaves();
        assert.equal(env.writes.length, 0);
        assert.equal(env.disk['bookmarks.json'], rejected);
    }
    archive(env, [group('recovered')]);
    await env.plugin.onDataChanged();
    assert.equal(env.stores.groups[0].id, 'recovered');
});

test('a model-owned query finishes before replacement, without per-method revision checks', async () => {
    const env = environment();
    const dynamic = { ...group('g'), type: 'dynamic', rule: { type: 'sql', input: 'select * from blocks' } };
    archive(env, [dynamic]);
    await env.plugin.onload();
    const query = barrier();
    env.ruleQuery(async () => { await query.promise; return [{ id: 'old-query-result', content: 'Old', type: 'p', box: 'box' }]; });
    const pending = env.model().updateDynamicGroup(env.stores.groups[0]);
    archive(env, [group('g', ['remote-item'])]);
    const refresh = env.plugin.onDataChanged();
    await env.settle();
    assert.equal(env.stores.groups[0].type, 'dynamic');
    query.release();
    await pending;
    await refresh;
    assert.deepEqual(env.stores.groups[0].items.map(item => item.id), ['remote-item']);
    assert.equal(env.stores.itemInfo['old-query-result'], undefined);
});

test('an already-running debounced metadata query settles before reading replacement storage', async () => {
    const env = environment();
    archive(env, [group('g', ['a'])]);
    await env.plugin.onload();
    const query = barrier();
    env.beforeQuery(() => query.promise);
    env.model().updateGroupStaticItemsDebounced(env.stores.groups[0]);
    await env.flushSaves();
    assert.equal(env.queries.length, 1);
    const reads = env.reads.length;
    archive(env, [group('g', ['b'])]);
    const refresh = env.plugin.onDataChanged();
    await env.settle();
    try {
        assert.equal(env.reads.length, reads, 'must wait for the running debounce, not just cancel its timer');
    } finally {
        query.release();
        await refresh;
    }
    assert.deepEqual(env.stores.groups[0].items.map(item => item.id), ['b']);
});

test('new dynamic members get metadata and serialization does not mutate the live group', async () => {
    const env = environment();
    archive(env, [{ ...group('dynamic'), type: 'dynamic', rule: { type: 'sql', input: 'select * from blocks' } }]);
    env.ruleQuery(async () => [{ id: 'dynamic-item', content: 'Rule result', type: 'p', box: 'box' }]);
    await env.plugin.onload();
    await env.model().updateViews();
    assert.deepEqual(env.queries.at(-1), ['dynamic-item']);
    env.model().save();
    await env.flushSaves();
    assert.deepEqual(env.stores.groups[0].items.map(item => item.id), ['dynamic-item']);
    assert.deepEqual(env.disk['bookmarks.json'].groups.dynamic.items, []);
});

test('new/hidden/deleted Docks and title/icon changes follow storage while local identity is retained', async () => {
    const type = 'sy-bookmark-plus::sub-view::LeftTop::retained';
    const env = environment({ legacy: true, cachedDocks: { [type]: { title: 'Old host cache', icon: 'iconOld', position: 'LeftTop' } } });
    archive(env, [], { retained: view('Current', [], { dockPosition: 'RightBottom', icon: { type: 'symbol', value: 'iconStar' } }), removed: view('Removed') });
    await env.plugin.onload();
    assert.equal(env.plugin.docks[type].config.position, 'LeftTop');
    assert.equal(env.plugin.docks[type].config.title, 'Current');
    archive(env, [], { retained: view('Renamed', [], { dockPosition: 'RightTop' }), added: view('Added') });
    await env.plugin.onDataChanged();
    assert.equal(env.plugin.docks[type].config.position, 'LeftTop');
    assert.equal(env.plugin.docks[type].config.title, 'Renamed');
    assert.equal(env.icons.get(type).attrs.href, '#iconEmoji');
    assert.equal(Object.keys(env.plugin.docks).some(key => key.endsWith('::removed')), false);
    assert.equal(Object.keys(env.plugin.docks).some(key => key.endsWith('::added')), true);
    env.disk['bookmark-sub-views.json'].added.hidden = true;
    await env.plugin.onDataChanged();
    assert.equal(Object.keys(env.plugin.docks).some(key => key.endsWith('::added')), false);
});

test('a newly restored subview starts metadata queries even if no previous Dock was mounted', async () => {
    const env = environment();
    archive(env, [group('g', ['a'])]);
    await env.plugin.onload();
    assert.equal(env.queries.length, 0);
    env.mountNewDocks(true);
    env.disk['bookmark-sub-views.json'] = { newview: view('New view', ['g']) };
    await env.plugin.onDataChanged();
    await env.settle();
    assert.ok(env.queries.some(ids => ids.includes('a')));
    assert.equal(env.stores.itemInfo.a.title, 'Kernel a');
});

test('settings-window addDock no-op is supported during load and later notifications', async () => {
    const env = environment({ noDocks: true });
    archive(env, [], { visible: view('Visible') });
    await env.plugin.onload();
    await env.plugin.onDataChanged();
    assert.deepEqual(env.plugin.docks, {});
    assert.equal(env.errors.length, 0);
});

test('a window without Docks still receives an actionable failure Dialog', async () => {
    const env = environment({ noDocks: true });
    env.readFailures.set('bookmarks.json', 500);
    await env.plugin.onload();
    const failure = env.dialogs.find(dialog => dialog.options.content.includes('Storage read failed'));
    assert.ok(failure);
    assert.match(failure.options.content, /Retry/);
    env.readFailures.clear();
    archive(env, [group('recovered')]);
    failure.buttons[0].click();
    await env.plugin.onDataChanged();
    assert.equal(failure.destroyed, true);
    assert.equal(env.stores.groups[0].id, 'recovered');
});

test('settings reapply without duplicate commands/listeners and preserve user command shortcuts', async () => {
    const env = environment();
    await env.plugin.onload();
    env.disk['bookmark-configs.json'] = { replaceDefault: true, autoRefreshTemplatingRuleOnSwitchProtyle: true };
    for (let i = 0; i < 3; i++) await env.plugin.onDataChanged();
    assert.equal(env.plugin.commands.length, 1);
    assert.equal(env.plugin.commands[0].customHotkey, '⌥X');
    // listeners 是 Set, 同一 handler 重复 on 不会变大; 用 on/off 计数对验证 off/on 配对
    assert.equal(env.listeners.size, 1);
    assert.equal(env.events.on, env.events.off + 1);
    env.disk['bookmark-configs.json'] = { replaceDefault: false };
    await env.plugin.onDataChanged();
    assert.equal(env.plugin.commands[0].customHotkey, '');
    assert.equal(env.window.siyuan.config.keymap.general.bookmark.custom, '⌥B');
    // switch-protyle 监听器常驻注册; 全局开关只在每次切换时实时判定 'default' 档,
    // 这里只验证重复 applySettings 不累积监听器
    assert.equal(env.listeners.size, 1);
    env.disk['bookmark-configs.json'] = { replaceDefault: true, autoRefreshTemplatingRuleOnSwitchProtyle: true };
    await env.plugin.onDataChanged();
    assert.equal(env.plugin.commands[0].customHotkey, '⌥X');
    assert.equal(env.plugin.commands.length, 1);
    env.plugin.onunload();
    assert.equal(env.listeners.size, 0);
    assert.equal(env.events.on, env.events.off);
});

test('an explicitly cleared shortcut stays disabled after toggling bookmark replacement and reapplying settings', async () => {
    const env = environment();
    env.disk['bookmark-configs.json'] = { replaceDefault: true };
    await env.plugin.onload();
    const command = env.plugin.commands[0];
    command.customHotkey = ''; // SiYuan uses an empty string for a user-disabled shortcut.
    env.stores.setConfigs('replaceDefault', false);
    env.plugin.applySettings();
    env.stores.setConfigs('replaceDefault', true);
    env.plugin.applySettings();
    assert.equal(command.customHotkey, '');
    await env.plugin.onDataChanged();
    assert.equal(command.customHotkey, '');
    assert.equal(env.plugin.commands.length, 1);
    env.plugin.onunload();
});

test('legacy mobile can reopen a removed and recreated view with the same identity', async () => {
    const env = environment({ mobile: true, legacy: true });
    archive(env, [], { v: view('View') });
    await env.plugin.onload();
    const key = Object.keys(env.plugin.docks).find(key => key.endsWith('::v'));
    env.openMobileDock(key);
    assert.equal(env.mobileContent(), 'v');
    env.disk['bookmark-sub-views.json'] = {};
    await env.plugin.onDataChanged();
    assert.equal(env.mobileContent(), undefined);
    env.disk['bookmark-sub-views.json'] = { v: view('Recreated') };
    await env.plugin.onDataChanged();
    env.openMobileDock(key);
    assert.equal(env.mobileContent(), 'v');
});

test('a timed-out host write remains paused until it really settles and a retry succeeds', async () => {
    const env = environment();
    archive(env, [group('g')]);
    await env.plugin.onload();
    const write = barrier();
    env.beforeWrite(() => write.promise);
    env.model().renameGroup('g', 'Local');
    await env.flushSaves();
    const readCount = env.reads.length;
    const refresh = env.plugin.onDataChanged();
    await env.settle();
    env.fireTimeouts();
    await refresh;
    assert.equal(env.reads.length, readCount, 'cannot read past an unsettled write');
    await env.stores.saveSubViews();
    assert.equal(env.writes.length, 1);
    write.release();
    await env.settle();
    assert.equal(env.writes.length, 1, 'remaining files in the old save must not be written');
    await env.plugin.onDataChanged();
    env.model().renameGroup('g', 'After retry');
    await env.flushSaves();
    assert.equal(env.disk['bookmarks.json'].groups.g.name, 'After retry');
});

test('unload during a read never commits or recreates content afterwards', async () => {
    const env = environment({ mount: true });
    archive(env, [group('old')]);
    await env.plugin.onload();
    await env.settle();
    const read = barrier();
    env.beforeRead(() => read.promise);
    archive(env, [group('new')]);
    const refresh = env.plugin.onDataChanged();
    await env.settle();
    env.plugin.onunload();
    read.release();
    await refresh;
    assert.deepEqual(env.stores.groups.map(group => group.id), ['old']);
    assert.deepEqual(Object.keys(env.dockModule.disposers._disposer), []);
});
