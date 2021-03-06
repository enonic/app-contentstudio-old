import {SchedulePublishDialog} from '../publish/SchedulePublishDialog';
import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from './DependantItemsWithProgressDialog';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {CompareStatus} from '../content/CompareStatus';
import DropdownButtonRow = api.ui.dialog.DropdownButtonRow;
import i18n = api.util.i18n;

export abstract class BasePublishDialog
    extends DependantItemsWithProgressDialog {

    protected showScheduleAction: ShowSchedulePublishDialogAction;
    private scheduleDialog: SchedulePublishDialog;

    constructor(config: DependantItemsWithProgressDialogConfig) {
        super(config);
        this.addClass('schedulable-dialog');
    }

    getButtonRow(): DropdownButtonRow {
        return <DropdownButtonRow>super.getButtonRow();
    }

    protected getFromDate(): Date {
        return this.scheduleDialog.getFromDate();
    }

    protected getToDate(): Date {
        return this.scheduleDialog.getToDate();
    }

    protected initActions() {
        if (!this.showScheduleAction) {
            this.showScheduleAction = new ShowSchedulePublishDialogAction();
            this.showScheduleAction.onExecuted(this.showScheduleDialog.bind(this));
        }
    }

    protected lockControls() {
        super.lockControls();
        this.showScheduleAction.setEnabled(false);
    }

    protected unlockControls() {
        super.unlockControls();
        this.showScheduleAction.setEnabled(true);
    }

    protected toggleAction(enable: boolean) {
        this.toggleControls(enable);
        this.toggleClass('no-action', !enable);
    }

    protected countTotal(): number {
        return this.countToPublish(this.getItemList().getItems()) + this.getDependantIds().length;
    }

    protected updateShowScheduleDialogButton() {
        this.showScheduleAction.setEnabled(this.isScheduleButtonAllowed());
    }

    protected doScheduledAction() {
        throw Error('Must be implemented in inheritors');
    }

    protected isScheduleButtonAllowed(): boolean {
        return true;
    }

    protected hasSubDialog(): boolean {
        return true;
    }

    private showScheduleDialog() {
        if (!this.scheduleDialog) {
            this.scheduleDialog = new SchedulePublishDialog();
            this.scheduleDialog.onClose(() => {
                this.removeClass('masked');
                this.getEl().focus();
            });
            this.scheduleDialog.onSchedule(() => {
                this.doScheduledAction();
                // this.doPublish(true);
            });
            this.addClickIgnoredElement(this.scheduleDialog);
        }
        this.scheduleDialog.open();
        this.addClass('masked');
    }

    private countToPublish(summaries: ContentSummaryAndCompareStatus[]): number {
        return summaries.reduce((count, summary: ContentSummaryAndCompareStatus) => {
            return summary.getCompareStatus() !== CompareStatus.EQUAL ? ++count : count;
        }, 0);
    }
}

export class ShowSchedulePublishDialogAction
    extends api.ui.Action {
    constructor() {
        super(i18n('action.scheduleMore'));
        this.setIconClass('show-schedule-action');
    }
}
