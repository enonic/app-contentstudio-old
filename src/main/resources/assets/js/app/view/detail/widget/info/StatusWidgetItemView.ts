import {WidgetItemView} from '../../WidgetItemView';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {CompareStatus} from '../../../../content/CompareStatus';
import {PublishStatus} from '../../../../publish/PublishStatus';
import {Content} from '../../../../content/Content';
import {ContentSummaryAndCompareStatusFetcher} from '../../../../resource/ContentSummaryAndCompareStatusFetcher';

export class StatusWidgetItemView
    extends WidgetItemView {

    private content: ContentSummaryAndCompareStatus;

    public static debug: boolean = false;

    constructor() {
        super('status-widget-item-view');
    }

    public setContentAndUpdateView(item: Content): wemQ.Promise<any> {
        return ContentSummaryAndCompareStatusFetcher.fetch(item.getContentId()).then(contentSummaryAndCompareStatus => {
            let compareStatus = contentSummaryAndCompareStatus.getCompareStatus();
            let publishStatus = contentSummaryAndCompareStatus.getPublishStatus();
            if (StatusWidgetItemView.debug) {
                console.debug('StatusWidgetItemView.setCompareStatus: ', compareStatus);
                console.debug('StatusWidgetItemView.setPublishStatus: ', publishStatus);
            }
            const timePublished = content =>
                content && content.getContentSummary() && content.getContentSummary().getPublishFirstTime() || 0;
            const statusChanged = publishStatus !== this.getPublishStatus() ||
                                  compareStatus !== this.getCompareStatus() ||
                                  (compareStatus === CompareStatus.NEW && timePublished(contentSummaryAndCompareStatus) !==
                                   timePublished(this.content));
            if (statusChanged) {
                this.content = contentSummaryAndCompareStatus;
                return this.layout();
            }
            return wemQ<any>(null);
        });

    }

    private getCompareStatus(): CompareStatus {
        return this.content ? this.content.getCompareStatus() : null;
    }

    private getPublishStatus(): PublishStatus {
        return this.content ? this.content.getPublishStatus() : null;
    }

    public layout(): wemQ.Promise<any> {
        if (StatusWidgetItemView.debug) {
            console.debug('StatusWidgetItemView.layout');
        }

        return super.layout().then(() => {
            if (this.getCompareStatus() != null) {
                let statusEl = new api.dom.SpanEl();

                statusEl.setHtml(this.content.getStatusText().toLocaleUpperCase());
                statusEl.addClass(this.content.getStatusClass());

                this.removeChildren();
                this.appendChild(statusEl);
            } else {
                this.removeChildren();
            }
        });
    }
}
