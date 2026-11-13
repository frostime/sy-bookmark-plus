const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadSource } = require('./storage-refresh-environment.cjs');

const { migrateBookmarkStorage, CURRENT_BOOKMARK_SCHEMA } = loadSource('src/model/migration.ts', {});
const group = (id, extra = {}) => ({ id, name: id, type: 'normal', items: [], ...extra });
const archive = (schema, groups, members) => ({ schema, groups, defaultView: { groups: members } });

test('unversioned bookmarks preserve the old default membership before removing group.hidden', () => {
    const raw = {
        second: group('second', { hidden: false, expand: true, items: [{ id: 'b', style: 'color: red' }] }),
        private: group('private', { hidden: true }),
        first: group('first')
    };
    const original = structuredClone(raw);
    const { storage, migrated } = migrateBookmarkStorage(raw);
    assert.equal(storage.schema, '3.0');
    assert.equal(migrated, true);
    assert.deepEqual(storage.defaultView.groups, ['second', 'first']);
    assert.deepEqual(Object.keys(storage.groups), ['second', 'private', 'first']);
    assert.deepEqual(storage.groups.second.items, original.second.items);
    assert.equal(storage.groups.second.expand, true);
    for (const value of Object.values(storage.groups)) assert.equal(Object.hasOwn(value, 'hidden'), false);
    assert.deepEqual(raw, original, 'migration must not mutate its input');
});

test('2.0 to 3.0 preserves explicit membership and order even when hidden disagrees', () => {
    const groups = {
        a: group('a', { hidden: true, icon: null }),
        b: group('b', { hidden: false, rule: { type: '', input: '' } }),
        c: group('c', { hidden: false, type: 'dynamic', rule: { type: 'js', input: 'return [];' }, refreshOnDocSwitch: 'on' })
    };
    for (const members of [['b', 'a'], []]) {
        const raw = archive('2.0', groups, members);
        const original = structuredClone(raw);
        const { storage, migrated } = migrateBookmarkStorage(raw);
        assert.equal(storage.schema, '3.0');
        assert.equal(migrated, true);
        assert.deepEqual(storage.defaultView.groups, members);
        assert.deepEqual(storage.groups.b.rule, { type: '', input: '' });
        assert.deepEqual(storage.groups.c.rule, groups.c.rule);
        assert.equal(storage.groups.c.refreshOnDocSwitch, 'on');
        for (const value of Object.values(storage.groups)) assert.equal(Object.hasOwn(value, 'hidden'), false);
        assert.deepEqual(raw, original);
        assert.equal(migrateBookmarkStorage(storage).migrated, false);
    }
});

test('current schema is validated without scheduling another migration or changing membership', () => {
    const raw = archive('3.0', { a: group('a') }, []);
    const result = migrateBookmarkStorage(raw);
    assert.equal(CURRENT_BOOKMARK_SCHEMA, '3.0');
    assert.equal(result.migrated, false);
    assert.deepEqual(result.storage, raw);
    const missing = migrateBookmarkStorage(undefined);
    assert.equal(missing.migrated, false);
    assert.deepEqual(missing.storage, archive('3.0', {}, []));
});

test('declared schemas are exact dispatch keys, not hints inferred from fields or version ordering', () => {
    for (const schema of ['1.0', '2.1', '4.0', '2.0.0', '', null, 2]) {
        assert.throws(() => migrateBookmarkStorage(archive(schema, {}, [])), /schema/i);
    }
    assert.throws(() => migrateBookmarkStorage({ groups: {}, defaultView: { groups: [] } }), /invalid/i);
    assert.throws(() => migrateBookmarkStorage(null), /invalid/i);
});

test('invalid source data is rejected instead of repaired or migrated into an empty archive', () => {
    for (const schema of ['2.0', '3.0']) {
        for (const invalid of [
            archive(schema, [], []),
            { schema, groups: { a: group('a') } },
            archive(schema, { a: group('different-id') }, ['a']),
            archive(schema, { a: group('a', { items: null }) }, ['a']),
            archive(schema, { a: group('a', { refreshOnDocSwitch: 'sometimes' }) }, ['a']),
            archive(schema, { a: group('a') }, ['missing']),
            archive(schema, { a: group('a') }, ['a', 'a'])
        ]) assert.throws(() => migrateBookmarkStorage(invalid), /invalid/i);
    }
    assert.throws(() => migrateBookmarkStorage(archive('2.0', { a: group('a', { hidden: 'yes' }) }, [])), /hidden/i);
    assert.throws(() => migrateBookmarkStorage(archive('3.0', { a: group('a', { hidden: false }) }, [])), /hidden/i);
});
