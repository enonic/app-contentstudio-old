import {ContentTreeGrid} from '../ContentTreeGrid';
import {EditContentEvent} from '../../event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import Action = api.ui.Action;
import i18n = api.util.i18n;

export class EditContentAction extends Action {

    private static MAX_ITEMS_TO_EDIT: number = 50;

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.edit'), 'mod+e');
        this.setEnabled(false);
        this.onExecuted(() => {
            let contents: ContentSummaryAndCompareStatus[]
                = grid.getSelectedDataList().filter((content) => !content.isReadOnly());

            if (contents.length > EditContentAction.MAX_ITEMS_TO_EDIT) {
                api.notify.showWarning(i18n('notify.edit.tooMuch'));
            } else {
                new EditContentEvent(contents).fire();
            }

        });
    }
}
