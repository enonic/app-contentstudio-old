import {MobileDetailsPanel} from './detail/MobileDetailsSlidablePanel';
import {ContentItemPreviewPanel} from './ContentItemPreviewPanel';
import {MobileDetailsPanelToggleButton} from './detail/button/MobileDetailsPanelToggleButton';
import {DetailsView} from './detail/DetailsView';
import {MobilePreviewFoldButton} from './MobilePreviewFoldButton';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentHelper} from '../util/ContentHelper';
import ViewItem = api.app.view.ViewItem;
import StringHelper = api.util.StringHelper;
import ResponsiveManager = api.ui.responsive.ResponsiveManager;
import ResponsiveItem = api.ui.responsive.ResponsiveItem;
import Action =  api.ui.Action;

export class MobileContentItemStatisticsPanel
    extends api.app.view.ItemStatisticsPanel<ContentSummaryAndCompareStatus> {

    private itemHeader: api.dom.DivEl = new api.dom.DivEl('mobile-content-item-statistics-header');
    private headerLabel: api.dom.H6El = new api.dom.H6El('mobile-header-title');

    private previewPanel: ContentItemPreviewPanel;
    private detailsPanel: MobileDetailsPanel;
    private detailsToggleButton: MobileDetailsPanelToggleButton;

    private foldButton: MobilePreviewFoldButton;

    private slideOutListeners: { (): void }[] = [];
    private slideInListeners: { (): void }[] = [];

    constructor(actions: Action[], detailsView: DetailsView) {
        super('mobile-content-item-statistics-panel');

        this.setDoOffset(false);

        this.createFoldButton(actions);

        this.initHeader();

        this.initPreviewPanel();

        this.initDetailsPanel(detailsView);

        this.initDetailsPanelToggleButton();

        this.initListeners();

        this.onRendered(() => {
            this.detailsPanel.setOffsetTop(this.itemHeader.getEl().getHeightWithBorder());
        });
    }

    private initListeners() {

        let reloadItemPublishStateChange = (contents: ContentSummaryAndCompareStatus[]) => {
            let thisContentId = this.getItem().getModel().getId();

            let contentSummary: ContentSummaryAndCompareStatus = contents.filter((content) => {
                return thisContentId === content.getId();
            })[0];

            if (contentSummary) {
                this.setItem(ContentHelper.createView(contentSummary));
            }
        };

        let serverEvents = ContentServerEventsHandler.getInstance();

        serverEvents.onContentPublished(reloadItemPublishStateChange);
        serverEvents.onContentUnpublished(reloadItemPublishStateChange);

        this.onRendered(() => this.slideAllOut(true));

        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            if (this.detailsPanel.isSlidedIn()) {
                this.slideAllOut();
            }
        });
    }

    private createFoldButton(actions: Action[]) {
        this.foldButton = new MobilePreviewFoldButton(actions, this.itemHeader);
    }

    private initHeader() {

        const icon = new api.dom.IEl('icon-more_vert');
        const backButton = new api.dom.DivEl('mobile-details-panel-back-button');
        backButton.onClicked((event) => {
            this.foldButton.collapse();
            this.slideAllOut();
            event.stopPropagation();
        });
        this.itemHeader.appendChildren(this.headerLabel, icon, this.foldButton, backButton);

        this.appendChild(this.itemHeader);
    }

    private initDetailsPanel(detailsView: DetailsView) {
        this.detailsPanel = new MobileDetailsPanel(detailsView);

        this.appendChild(this.detailsPanel);
    }

    private initDetailsPanelToggleButton() {
        this.detailsToggleButton = new MobileDetailsPanelToggleButton(this.detailsPanel, () => {
            this.foldButton.collapse();
            this.calcAndSetDetailsPanelTopOffset();
        });
        this.itemHeader.appendChild(this.detailsToggleButton);
    }

    private initPreviewPanel() {
        this.previewPanel = new ContentItemPreviewPanel();
        this.previewPanel.setDoOffset(false);
        this.previewPanel.addClass('mobile');
        this.appendChild(this.previewPanel);
    }

    setItem(item: ViewItem<ContentSummaryAndCompareStatus>) {
        if (!this.getItem() || !this.getItem().equals(item)) {
            super.setItem(item);
            this.toggleClass('invalid', !item.getModel().getContentSummary().isValid());
            this.foldButton.collapse();
            this.detailsPanel.setItem(!!item ? item.getModel() : null);
            if (item) {
                this.setName(this.makeDisplayName(item));
            }
        }
    }

    private makeDisplayName(item: ViewItem<ContentSummaryAndCompareStatus>): string {
        let localName = item.getModel().getType().getLocalName() || '';
        return StringHelper.isEmpty(item.getDisplayName())
               ? api.content.ContentUnnamed.prettifyUnnamed(localName)
               : item.getDisplayName();
    }

    getDetailsPanel(): MobileDetailsPanel {
        return this.detailsPanel;
    }

    getPreviewPanel(): ContentItemPreviewPanel {
        return this.previewPanel;
    }

    private setName(name: string) {
        this.headerLabel.getHTMLElement().textContent = name;
    }

    slideAllOut(silent?: boolean) {
        this.slideOut(silent);
        this.detailsPanel.slideOut(silent);
    }

    // hide
    slideOut(silent?: boolean) {
        this.getEl().setRightPx(-this.getEl().getWidthWithBorder());
        api.dom.Body.get().getHTMLElement().classList.remove('mobile-statistics-panel');
        if (!silent) {
            this.notifySlideOut();
        }
    }

    // show
    slideIn(silent?: boolean) {
        api.dom.Body.get().getHTMLElement().classList.add('mobile-statistics-panel');
        this.getEl().setRightPx(0);
        if (!silent) {
            this.notifySlideIn();
        }
    }

    onSlideIn(listener: () => void) {
        this.slideInListeners.push(listener);
    }

    unSlideIn(listener: () => void) {
        this.slideInListeners = this.slideInListeners.filter(curr => curr !== listener);
    }

    notifySlideIn() {
        this.slideInListeners.forEach(curr => curr());
    }

    onSlideOut(listener: () => void) {
        this.slideOutListeners.push(listener);
    }

    unSlideOut(listener: () => void) {
        this.slideOutListeners = this.slideOutListeners.filter(curr => curr !== listener);
    }

    notifySlideOut() {
        this.slideOutListeners.forEach(curr => curr());
    }

    private calcAndSetDetailsPanelTopOffset() {
        this.detailsPanel.getEl().setTopPx(this.itemHeader.getEl().getHeightWithMargin());
    }
}
