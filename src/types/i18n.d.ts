interface I18n {
    msg: {
        ruleFailed: string;
        ruleInvalid: string;
        itemHasInGroup: string;
        itemNotFoundInGroup: string;
        groupNameEmpty: string;
    };
    itemErr: {
        closed: string;
        deleted: string;
    };
    setting: {
        replaceDefault: {
            title: string;
            description: string;
        };
        viewMode: {
            title: string;
            description: string;
        };
        hideClosed: {
            title: string;
            description: string;
        };
        hideDeleted: {
            title: string;
            description: string;
        };
        grouplist: {
            title: string;
            description: string;
        };
        autoRefreshOnExpand: {
            title: string;
            description: string;
        };
        ariaLabel: {
            title: string;
            description: string;
        };
    };
    viewMode: {
        bookmark: string;
        card: string;
    };
    bookmark: {
        new: string;
        delete: {
            title: string;
            desc: string;
        };
        cache: string;
        logo: {
            name: string;
            setting: string;
            add: string;
            refresh: string;
            expand: string;
            collapse: string;
            min: string;
        };
    };
    group: {
        msgexist: string;
        msg404: string;
        refresh: string;
        copyref: string;
        copylink: string;
        msgcopy: string;
        docflow: string;
        rename: string;
        edit: string;
        delete: string;
        move: string;
        top: string;
        up: string;
        down: string;
        bottom: string;
        fromclipboard: string;
        msgparse: string;
        currentdoc: string;
        msgdelconfirm: string[];
    };
    item: {
        copyref: string;
        copylink: string;
        msgcopy: string;
        style: string;
        transfer: string;
        move: string;
        top: string;
        bottom: string;
        del: string;
        checkerritem: string;
        copyitem: string;
    };
    newgroup: {
        name: string[];
        type: string[];
        rtype: string[];
        rinput: string;
        desc: {
            sql: string;
            backlinks: string;
            attr: string;
        };
        choosetemplate: string;
        postprocess: {
            ariaLabel: string;
            name: string;
            omit: string;
            fb2p: string;
            b2doc: string;
        };
        icontitle: string;
        icondesc: string;
    };
    bookmarktype: {
        normal: string;
        dynamic: string;
        composed: string;
    };
    ruletype: {
        sql: string;
        backlinks: string;
        attr: string;
    };
    template: {
        sql: {
            random: string;
            updated: string;
            thisday: string;
            todo: string;
        };
        attr: {
            dailynote: string;
        };
    };
    selecticon: {
        title: string;
        h3: string;
        reset: string;
    };
}
