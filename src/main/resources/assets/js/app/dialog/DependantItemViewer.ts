import '../../api.ts';
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import Attribute = api.app.Attribute;

export class DependantItemViewer extends api.ui.NamesAndIconViewer<ContentSummaryAndCompareStatus> {

    constructor() {
        super('dependant-item-viewer');
    }

    resolveDisplayName(object: ContentSummaryAndCompareStatus): string {
        let pendingDelete = (api.content.CompareStatus.PENDING_DELETE === object.getCompareStatus());

        this.toggleClass('pending-delete', pendingDelete);
        return object.getPath().toString();
    }

    resolveSubName(object: ContentSummaryAndCompareStatus): string {
        return super.resolveSubName(object);
    }

    resolveIconUrl(object: ContentSummaryAndCompareStatus): string {
        if(! object.getType().isImage()) {
            return new api.content.util.ContentIconUrlResolver().setContent(object.getContentSummary()).resolve();
        }
    }
    resolveIconClass (object: ContentSummaryAndCompareStatus): string {
        if(object.getType().isImage()) {
            return 'image';
        }
    }

    resolveHint(object: ContentSummaryAndCompareStatus): string {
        return object.getPath().toString();
    }

    resolveMainNameData(object: ContentSummaryAndCompareStatus): Attribute {
        const lang = object.getContentSummary().getLanguage();
        const value = !lang ? '' : `(${lang})`;
        return {name: 'locale', value};
    }

    protected getHintTargetEl(): api.dom.ElementHelper {
        return this.getNamesAndIconView().getEl();
    }
}
