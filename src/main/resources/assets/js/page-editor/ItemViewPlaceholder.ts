import i18n = api.util.i18n;

export class ItemViewPlaceholder
    extends api.dom.DivEl {

    static PAGE_EDITOR_PREFIX: string = 'xp-page-editor-';

    constructor() {
        super('item-placeholder', ItemViewPlaceholder.PAGE_EDITOR_PREFIX);
    }

    showRenderingError(url: string, errorMessage: string = i18n('live.view.component.render.error')) {

        this.removeChildren();
        this.addClass('rendering-error');

        let errorTitle = new api.dom.PEl().setHtml(errorMessage);

        let urlAnchor = new api.dom.AEl().setUrl(url, '_blank').setHtml(i18n('live.view.component.render.error.urltext'));

        this.appendChildren(errorTitle, urlAnchor);
    }

    select() {
        // must be implemented by children
    }

    deselect() {
        // must be implemented by children
    }
}
