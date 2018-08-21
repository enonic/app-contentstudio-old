import '../../api.ts';
import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {ContentDuplicateDialogAction} from './ContentDuplicateDialogAction';
import {ContentDuplicatePromptEvent} from '../browse/ContentDuplicatePromptEvent';
import {DialogTogglableItemList} from '../dialog/DialogTogglableItemList';
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import DuplicateContentRequest = api.content.resource.DuplicateContentRequest;
import ResolveDuplicateDependenciesRequest = api.content.resource.ResolveDuplicateDependenciesRequest;
import DuplicatableId = api.content.resource.DuplicatableId;
import ManagedActionExecutor = api.managedaction.ManagedActionExecutor;
import ListBox = api.ui.selector.list.ListBox;
import i18n = api.util.i18n;
import ContentId = api.content.ContentId;

export class ContentDuplicateDialog
    extends DependantItemsWithProgressDialog
    implements ManagedActionExecutor {

    private yesCallback: () => void;

    private noCallback: () => void;

    private totalItemsToDuplicate: number;

    private messageId: string;

    constructor() {
        super(<DependantItemsWithProgressDialogConfig> {
                title: i18n('dialog.duplicate'),
                showDependantList: false,
                dependantsDescription: i18n('dialog.duplicate.dependants'),
                processingLabel: `${i18n('field.progress.duplicating')}...`,
                processHandler: () => new ContentDuplicatePromptEvent([]).fire()
            }
        );

        this.addClass('content-duplicate-dialog');

        const duplicateAction = new ContentDuplicateDialogAction();
        duplicateAction.onExecuted(this.doDuplicate.bind(this, false));
        this.actionButton = this.addAction(duplicateAction, true, true);

        this.addCancelButtonToBottom();

        this.initItemListListeners();
    }

    protected getContentsToLoad(): ContentSummaryAndCompareStatus[] {
        return this.getItemList().getItemViews().map(view => view.getBrowseItem().getModel());
    }

    protected loadDescendantIds() {
        const contents = this.getContentsToLoad();

        const itemsIds = this.getItemList().getItems().map(content => content.getContentId());

        return ResolveDuplicateDependenciesRequest.create()
            .setIds(contents.map(content => content.getContentSummary().getContentId()))
            .setExcludeChildrenIds(this.getItemList().getInactiveTogglersIds())
            .build()
            .sendAndParse().then((result: ContentId[]) => {
                this.dependantIds = result;

                if (this.dependantIds) {
                    this.dependantIds = this.dependantIds.filter(dependantId =>
                        !api.util.ArrayHelper.contains(itemsIds, dependantId)
                    );
                }
            });
    }

    protected manageDescendants() {
        this.loadMask.show();
        this.lockControls();

        return this.loadDescendantIds().then(() => {
            this.loadDescendants(0, 20).then((descendants: ContentSummaryAndCompareStatus[]) => {
                this.setDependantItems(descendants);
                this.countItemsToDuplicateAndUpdateButtonCounter();
            }).finally(() => {
                this.loadMask.hide();
                this.unlockControls();
                this.updateTabbable();
                this.actionButton.giveFocus();
            });
        });
    }

    private initItemListListeners() {
        const reloadDependenciesDebounced = api.util.AppHelper.debounce(() => {
            this.manageDescendants();
        }, 100, false);

        this.getItemList().onItemsRemoved(reloadDependenciesDebounced);
        this.getItemList().onItemsAdded(reloadDependenciesDebounced);
        this.getItemList().onChildrenListChanged(reloadDependenciesDebounced);
    }

    manageContentToDuplicate(contents: ContentSummaryAndCompareStatus[]): ContentDuplicateDialog {
        this.setIgnoreItemsChanged(true);
        this.setListItems(contents);
        this.setIgnoreItemsChanged(false);
        return this;
    }

    clearDependantItems() {
        super.clearDependantItems();
        this.countItemsToDuplicateAndUpdateButtonCounter();
    }

    close() {
        super.close();
        if (this.messageId) {

            this.removeClickIgnoredElement(api.notify.NotifyManager.get().getNotification(this.messageId));
            api.notify.NotifyManager.get().hide(this.messageId);

            this.messageId = '';
        }
    }

    setContentToDuplicate(contents: ContentSummaryAndCompareStatus[]): ContentDuplicateDialog {
        this.manageContentToDuplicate(contents);
        this.manageDescendants();

        return this;
    }

    setYesCallback(callback: () => void): ContentDuplicateDialog {
        this.yesCallback = callback;
        return this;
    }

    setNoCallback(callback: () => void): ContentDuplicateDialog {
        this.noCallback = callback;
        return this;
    }

    private doDuplicate(ignoreConfirmation: boolean = false) {
        if (this.yesCallback) {
            this.yesCallback();
        }

        this.lockControls();

        this.createDuplicateRequest()
            .sendAndParse()
            .then((taskId: api.task.TaskId) => {
                this.pollTask(taskId);
            })
            .catch((reason) => {
                this.close();
                if (reason && reason.message) {
                    api.notify.showError(reason.message);
                }
            });
    }

    private countItemsToDuplicateAndUpdateButtonCounter() {
        this.actionButton.setLabel(i18n('action.duplicate'));

        this.totalItemsToDuplicate = this.countTotal();
        this.updateButtonCount(i18n('action.duplicate'), this.totalItemsToDuplicate);
    }

    private createDuplicateRequest(): DuplicateContentRequest {
        const duplicatableIds: DuplicatableId[] = this.getItemList().getItemViews().map(
            item => (<DuplicatableId>{contentId: item.getContentId(), includeChildren: item.includesChildren()}));

        const duplicateRequest = new DuplicateContentRequest(duplicatableIds);

        return duplicateRequest;
    }

    protected createItemList(): ListBox<ContentSummaryAndCompareStatus> {
        return new DialogTogglableItemList(true);
    }

    protected getItemList(): DialogTogglableItemList {
        return <DialogTogglableItemList>super.getItemList();
    }
}
