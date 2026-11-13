/*
 * @Author       : frostime
 * Copyright (c) 2026 by frostime. All Rights Reserved.
 * @Date         : 2026-02-21 01:53:06
 * @Description  :
 * @FilePath     : /src/model/migration.ts
 * @LastEditTime : 2026-02-21 14:33:40
 */
export const CURRENT_BOOKMARK_SCHEMA = '2.1';

type LegacyBookmarkGroup = IBookmarkGroup & { hidden?: boolean };
type BookmarkStorageV2 = {
    schema: '2.0';
    groups: Record<TBookmarkGroupId, LegacyBookmarkGroup>;
    defaultView: IBookmarkDefaultView;
};

/**
 * Only unversioned group maps, schema 2.0 and schema 2.1 are supported.
 * Invalid archives are rejected without repair; callers retain the displayed data.
 */
export const migrateBookmarkStorage = (raw: unknown): { storage: IBookmarkStorage; migrated: boolean } => {
    if (raw === undefined) {
        return { storage: { schema: CURRENT_BOOKMARK_SCHEMA, groups: {}, defaultView: { groups: [] } }, migrated: false };
    }
    assertRecord(raw, 'archive');
    const unversioned = !Object.hasOwn(raw, 'schema');
    const storage: unknown = unversioned ? importLegacyGroups(raw) : raw;
    validateStorage(storage);
    if (storage.schema === '2.0') {
        const migrated = migrateV2ToV21(storage);
        validateStorage(migrated);
        return { storage: migrated, migrated: true };
    }
    return { storage, migrated: false };
};

function importLegacyGroups(groups: Record<string, unknown>): BookmarkStorageV2 {
    validateGroups(groups, '2.0');
    return {
        schema: '2.0',
        groups,
        defaultView: {
            groups: Object.values(groups).filter(group => group.hidden !== true).map(group => group.id)
        }
    };
}

function migrateV2ToV21(storage: BookmarkStorageV2): IBookmarkStorage {
    const groups = Object.fromEntries(Object.entries(storage.groups).map(([id, group]) => {
        const { hidden, ...retained } = group;
        return [id, retained];
    }));
    return { ...storage, schema: CURRENT_BOOKMARK_SCHEMA, groups };
}

function validateStorage(raw: unknown): asserts raw is BookmarkStorageV2 | IBookmarkStorage {
    assertRecord(raw, 'archive');
    if (raw.schema !== '2.0' && raw.schema !== CURRENT_BOOKMARK_SCHEMA) {
        throw new Error(`Unsupported bookmark schema: ${String(raw.schema)}`);
    }
    const groups = raw.groups;
    validateGroups(groups, raw.schema);
    assertRecord(raw.defaultView, 'defaultView');
    assertValid(Array.isArray(raw.defaultView.groups), 'defaultView.groups must be an array');
    const members = raw.defaultView.groups;
    assertValid(members.every(id => typeof id === 'string' && Object.hasOwn(groups, id)), 'defaultView.groups must reference existing groups');
    assertValid(new Set(members).size === members.length, 'defaultView.groups must not contain duplicate IDs');
}

function validateGroups(raw: unknown, schema: '2.0' | '2.1'): asserts raw is Record<string, LegacyBookmarkGroup> {
    assertRecord(raw, 'groups');
    for (const [id, group] of Object.entries(raw)) {
        const path = `groups.${id}`;
        assertRecord(group, path);
        assertValid(id !== '' && group.id === id, `${path}.id must match its record key`);
        assertValid(typeof group.name === 'string', `${path}.name must be a string`);
        assertValid(group.type === undefined || ['normal', 'dynamic', 'composed'].includes(group.type as string), `${path}.type is invalid`);
        assertValid(group.expand === undefined || typeof group.expand === 'boolean', `${path}.expand must be a boolean`);
        if (schema === '2.1') {
            assertValid(!Object.hasOwn(group, 'hidden'), `${path}.hidden is not allowed in schema 2.1`);
        } else {
            assertValid(group.hidden === undefined || typeof group.hidden === 'boolean', `${path}.hidden must be a boolean`);
        }
        assertValid(group.refreshOnDocSwitch === undefined || ['default', 'on', 'off'].includes(group.refreshOnDocSwitch as string), `${path}.refreshOnDocSwitch is invalid`);
        assertValid(Array.isArray(group.items), `${path}.items must be an array`);
        for (const item of group.items) {
            assertRecord(item, `${path}.items entry`);
            assertValid(typeof item.id === 'string' && item.id !== '', `${path}.items entry must have an ID`);
            assertValid(item.style === undefined || typeof item.style === 'string', `${path}.items style must be a string`);
        }
        if (group.rule !== undefined) {
            assertRecord(group.rule, `${path}.rule`);
            // Static groups created by older versions can carry an unused empty rule type.
            const ruleTypes = ['sql', 'backlinks', 'attr', 'js'];
            if (group.type !== 'dynamic') ruleTypes.push('');
            assertValid(ruleTypes.includes(group.rule.type as string), `${path}.rule.type is invalid`);
            assertValid(typeof group.rule.input === 'string', `${path}.rule.input must be a string`);
        }
        if (group.icon !== undefined && group.icon !== null) {
            assertRecord(group.icon, `${path}.icon`);
            assertValid(['symbol', 'emoji', 'img', ''].includes(group.icon.type as string), `${path}.icon.type is invalid`);
            assertValid(typeof group.icon.value === 'string', `${path}.icon.value must be a string`);
        }
    }
}

function assertRecord(value: unknown, path: string): asserts value is Record<string, unknown> {
    assertValid(value !== null && typeof value === 'object' && !Array.isArray(value), `${path} must be an object`);
}

function assertValid(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(`Invalid bookmark storage: ${message}`);
}
