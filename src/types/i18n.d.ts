interface I18n {
    sync: {
        loading: string;
        readFailed: string;
        retry: string;
        conflictTitle: string;
        conflictBody: string;
        acknowledge: string;
    };
    bookmark: {
        cache: string;
        delete: {
            desc: string;
            title: string;
        };
        logo: {
            add: string;
            collapse: string;
            expand: string;
            min: string;
            name: string;
            refresh: string;
            setting: string;
        };
        new: string;
    };
    bookmarktype: {
        composed: string;
        dynamic: string;
        normal: string;
    };
    group: {
        bottom: string;
        copylink: string;
        copyref: string;
        currentdoc: string;
        delete: string;
        docflow: string;
        down: string;
        edit: string;
        fromclipboard: string;
        move: string;
        msg404: string;
        msgcopy: string;
        msgdelconfirm: string[];
        msgexist: string;
        msgparse: string;
        refresh: string;
        rename: string;
        top: string;
        up: string;
    };
    item: {
        bottom: string;
        checkerritem: string;
        copyitem: string;
        copylink: string;
        copyref: string;
        del: string;
        move: string;
        msgcopy: string;
        style: string;
        top: string;
        transfer: string;
    };
    itemErr: {
        closed: string;
        deleted: string;
    };
    msg: {
        groupNameEmpty: string;
        itemHasInGroup: string;
        itemNotFoundInGroup: string;
        ruleFailed: string;
        ruleInvalid: string;
    };
    newgroup: {
        choosetemplate: string;
        desc: {
            attr: string;
            backlinks: string;
            sql: string;
        };
        icondesc: string;
        icontitle: string;
        name: string[];
        postprocess: {
            ariaLabel: string;
            b2doc: string;
            fb2p: string;
            name: string;
            omit: string;
        };
        rinput: string;
        rtype: string[];
        type: string[];
    };
    ruletype: {
        attr: string;
        backlinks: string;
        js: string;
        sql: string;
    };
    selecticon: {
        h3: string;
        reset: string;
        title: string;
        subtitle: string;
        symbols: string;
        emojis: string;
        dynamic: string;
        dateicons: string;
        texticons: string;
        datestyles: string[];
        date: string;
        targetdate: string;
        datehelp: string;
        countdownhelp: string;
        dynamictext: string;
        dynamictexthint: string;
        texthelp: string;
        color: string;
        customcolor: string;
        image: string;
        imageaddress: string;
        imagehint: string;
        choosefile: string;
        filehint: string;
        oraddress: string;
        savedfile: string;
        invalidfile: string;
        filetoolarge: string;
        filereaderror: string;
        reading: string;
        loading: string;
        imageerror: string;
        retry: string;
        largepreview: string;
        actualpreview: string;
        referencegroup: string;
        referenceemoji: string;
        previewgroup: string;
        previewhelp: string;
        apply: string;
        cancel: string;
    };
    setting: {
        ariaLabel: {
            description: string;
            title: string;
        };
        autoRefreshOnExpand: {
            description: string;
            title: string;
        };
        grouplist: {
            description: string;
            title: string;
        };
        hideClosed: {
            description: string;
            title: string;
        };
        hideDeleted: {
            description: string;
            title: string;
        };
        replaceDefault: {
            description: string;
            title: string;
        };
        viewMode: {
            description: string;
            title: string;
        };
        zoomInWhenClick: {
            description: string;
            title: string;
        };
    };
    src_components_newgrouptsx: {
        query_block_list: string;
    };
    src_components_setting_indextsx: {
        all_bookmark_groups: string;
        basic_settings: string;
        refresh_bookmarks: string;
        refresh_groups: string;
        subview_management: string;
    };
    src_components_setting_subviewlisttsx: {
        bookmark_subview: string;
        bottom_left: string;
        bottom_right: string;
        confirm_delete_view: string;
        create_bookmark_view: string;
        current_view_bookmarks: string;
        default_view_add_group: string;
        default_view_desc: string;
        default_view_edit: string;
        default_view_empty: string;
        default_view_fixed: string;
        default_view_no_group_to_add: string;
        default_view_title: string;
        delete_bookmark_view: string;
        enter_view_name: string;
        new_view: string;
        other_bookmark_groups: string;
        top_left: string;
        top_right: string;
    };
    src_model_rulests: {
        js_query_result: string;
    };
    template: {
        attr: {
            dailynote: string;
        };
        sql: {
            random: string;
            thisday: string;
            todo: string;
            updated: string;
        };
    };
    viewMode: {
        bookmark: string;
        card: string;
    };
}
