export const CURRENT_BOOKMARK_SCHEMA = '2.0';

export const compareSchemaVersion = (a?: string, b?: string) => {
    const normalize = (version?: string) => {
        return (version ?? '0').split('.')
            .map((part) => {
                const parsed = Number.parseInt(part, 10);
                return Number.isNaN(parsed) ? 0 : parsed;
            });
    };

    const versionA = normalize(a);
    const versionB = normalize(b);
    const maxLen = Math.max(versionA.length, versionB.length);

    for (let i = 0; i < maxLen; i++) {
        const diff = (versionA[i] ?? 0) - (versionB[i] ?? 0);
        if (diff !== 0) {
            return diff > 0 ? 1 : -1;
        }
    }
    return 0;
};

const getDefaultGroupsFromHidden = (groupsMap: Record<TBookmarkGroupId, IBookmarkGroup>): TBookmarkGroupId[] => {
    return Object.values(groupsMap)
        .filter(group => group.hidden !== true)
        .map(group => group.id);
}

const asRecord = (value: unknown): Record<string, any> => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, any>;
    }
    return {};
}

const asStorage = (raw: any): IBookmarkStorageV2 => {
    const rawObj = asRecord(raw);
    const hasV2Container = rawObj.groups !== undefined;

    if (hasV2Container) {
        return {
            schema: `${rawObj.schema ?? '0'}`,
            groups: asRecord(rawObj.groups) as Record<TBookmarkGroupId, IBookmarkGroup>,
            defaultView: {
                groups: Array.isArray(rawObj.defaultView?.groups)
                    ? rawObj.defaultView.groups as TBookmarkGroupId[]
                    : []
            }
        }
    }

    return {
        schema: '0',
        groups: rawObj as Record<TBookmarkGroupId, IBookmarkGroup>,
        defaultView: {
            groups: []
        }
    }
}

export const migrateBookmarkStorage = (raw: any): { storage: IBookmarkStorageV2; migrated: boolean } => {
    let storage = asStorage(raw);
    const dataSchema = storage.schema;
    let migrated = false;

    if (compareSchemaVersion(dataSchema, CURRENT_BOOKMARK_SCHEMA) === 0) {
        return { storage, migrated };
    }

    if (compareSchemaVersion(dataSchema, CURRENT_BOOKMARK_SCHEMA) > 0) {
        return { storage, migrated };
    }

    // 2.0 版本: 向后兼容 schema < 2.0
    // 变更: 默认视图成员关系从 group.hidden 迁移到 defaultView.groups
    if (compareSchemaVersion(dataSchema, '2.0') < 0) {
        if (!Array.isArray(storage.defaultView.groups) || storage.defaultView.groups.length === 0) {
            storage.defaultView.groups = getDefaultGroupsFromHidden(storage.groups);
        }
        migrated = true;
    }

    const groupIds = new Set(Object.keys(storage.groups ?? {}));
    storage.defaultView.groups = (storage.defaultView.groups ?? []).filter((gid) => groupIds.has(gid));

    storage.schema = CURRENT_BOOKMARK_SCHEMA;
    migrated = true;

    return { storage, migrated };
}
