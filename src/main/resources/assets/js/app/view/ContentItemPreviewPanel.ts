import {ContentPreviewPathChangedEvent} from './ContentPreviewPathChangedEvent';
import {ContentItemPreviewToolbar} from './ContentItemPreviewToolbar';
import {RenderingMode} from '../rendering/RenderingMode';
import {UriHelper as RenderingUriHelper} from '../rendering/UriHelper';
import {Branch} from '../versioning/Branch';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentImageUrlResolver} from '../content/ContentImageUrlResolver';
import ViewItem = api.app.view.ViewItem;
import UriHelper = api.util.UriHelper;
import ContentTypeName = api.schema.content.ContentTypeName;
import PEl = api.dom.PEl;
import i18n = api.util.i18n;

enum PREVIEW_TYPE {
    IMAGE,
    SVG,
    PAGE,
    EMPTY,
    FAILED,
    BLANK
}

export class ContentItemPreviewPanel
    extends api.app.view.ItemPreviewPanel<ContentSummaryAndCompareStatus> {

    private image: api.dom.ImgEl;
    private item: ViewItem<ContentSummaryAndCompareStatus>;
    private skipNextSetItemCall: boolean = false;
    private previewType: PREVIEW_TYPE;
    private previewMessageEl: PEl;

    constructor() {
        super('content-item-preview-panel');

        this.initElements();

        this.setupListeners();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.image);
            return rendered;
        });
    }

    private initElements() {
        this.image = new api.dom.ImgEl();
    }

    private setupListeners() {
        this.image.onLoaded((event: UIEvent) => {
            this.hideMask();
        });

        this.image.onError((event: UIEvent) => {
            this.setPreviewType(PREVIEW_TYPE.FAILED);
        });

        this.onShown((event) => {
            if (this.item && this.hasClass('image-preview')) {
                this.addImageSizeToUrl(this.item);
            }
        });

        this.onHidden((event) => {
            if (this.mask.isVisible()) {
                this.hideMask();
            }
        });

        this.frame.onLoaded((event: UIEvent) => {
            const frameWindow = this.frame.getHTMLElement()['contentWindow'];

            try {
                if (frameWindow) {
                    frameWindow.addEventListener('click', this.frameClickHandler.bind(this));
                }
            } catch (error) { /* error */ }
        });
    }

    private frameClickHandler(event: UIEvent) {
        const linkClicked: string = this.getLinkClicked(event);
        if (linkClicked) {
            const frameWindow = this.frame.getHTMLElement()['contentWindow'];
            if (!!frameWindow && !UriHelper.isNavigatingOutsideOfXP(linkClicked, frameWindow)) {
                const contentPreviewPath = UriHelper.trimUrlParams(
                    UriHelper.trimAnchor(UriHelper.trimWindowProtocolAndPortFromHref(linkClicked,
                    frameWindow)));
                if (!this.isNavigatingWithinSamePage(contentPreviewPath, frameWindow) && !this.isDownloadLink(contentPreviewPath)) {
                    event.preventDefault();
                    const clickedLinkRelativePath = '/' + UriHelper.trimWindowProtocolAndPortFromHref(linkClicked, frameWindow);
                    this.skipNextSetItemCall = true;
                    new ContentPreviewPathChangedEvent(contentPreviewPath).fire();
                    this.showMask();
                    setTimeout(() => {
                        this.item = null; // we don't have ref to content under contentPreviewPath and there is no point in figuring it out
                        this.skipNextSetItemCall = false;
                        this.frame.setSrc(clickedLinkRelativePath);
                    }, 500);
                }
            }
        }
    }

    createToolbar(): ContentItemPreviewToolbar {
        return new ContentItemPreviewToolbar();
    }

    private getLinkClicked(event: UIEvent): string {
        if (event.target && (<any>event.target).tagName.toLowerCase() === 'a') {
            return (<any>event.target).href;
        }

        let el: Element = <Element>event.target;
        if (el) {
            while (el.parentNode) {
                el = <Element>el.parentNode;
                if (el.tagName && el.tagName.toLowerCase() === 'a') {
                    return (<any>el).href;
                }
            }
        }
        return '';
    }

    private isNavigatingWithinSamePage(contentPreviewPath: string, frameWindow: Window): boolean {
        const href = frameWindow.location.href;
        return contentPreviewPath === UriHelper.trimAnchor(UriHelper.trimWindowProtocolAndPortFromHref(href, frameWindow));
    }

    private isDownloadLink(contentPreviewPath: string): boolean {
        return contentPreviewPath.indexOf('attachment/download') > 0;
    }

    private addImageSizeToUrl(item: ViewItem<ContentSummaryAndCompareStatus>) {
        const imgSize = Math.max(this.getEl().getWidth(), (this.getEl().getHeight() - this.toolbar.getEl().getHeight()));
        const imgUrl = new ContentImageUrlResolver().setContentId(item.getModel().getContentId()).setTimestamp(
            item.getModel().getContentSummary().getModifiedTime()).setSize(imgSize).resolve();
        this.image.setSrc(imgUrl);
    }

    public setItem(item: ViewItem<ContentSummaryAndCompareStatus>, force: boolean = false) {
        if (item && !this.skipNextSetItemCall && (!item.equals(this.item) || force)) {
            if (typeof item.isRenderable() === 'undefined') {
                return;
            }
            if (item.getModel().getContentSummary().getType().isImage() ||
                item.getModel().getContentSummary().getType().isVectorMedia()) {

                if (this.isVisible()) {
                    if (item.getModel().getContentSummary().getType().equals(ContentTypeName.MEDIA_VECTOR)) {
                        this.setPreviewType(PREVIEW_TYPE.SVG);
                        const imgUrl = new ContentImageUrlResolver().setContentId(
                            item.getModel().getContentId()).setTimestamp(
                            item.getModel().getContentSummary().getModifiedTime()).resolve();
                        this.image.setSrc(imgUrl);
                    } else {
                        this.addImageSizeToUrl(item);
                        this.setPreviewType(PREVIEW_TYPE.IMAGE);
                    }
                } else {
                    this.setPreviewType(PREVIEW_TYPE.IMAGE);
                }
                if (!this.image.isLoaded()) {
                    this.showMask();
                }
            } else {
                this.showMask();
                if (item.isRenderable()) {
                    this.setPreviewType(PREVIEW_TYPE.PAGE);
                    const src = RenderingUriHelper.getPortalUri(item.getPath(), RenderingMode.INLINE, Branch.DRAFT);
                    // test if it returns no error( like because of used app was deleted ) first and show no preview otherwise
                    wemjq.ajax({
                        type: 'HEAD',
                        async: true,
                        url: src
                    }).done(() => {
                        this.frame.setSrc(src);
                    }).fail(() => this.setPreviewType(PREVIEW_TYPE.FAILED));
                } else {
                    this.setPreviewType(PREVIEW_TYPE.EMPTY);
                }
            }
        }
        this.toolbar.setItem(item.getModel());
        this.item = item;
    }

    public getItem(): ViewItem<ContentSummaryAndCompareStatus> {
        return this.item;
    }

    public setBlank() {
        this.setPreviewType(PREVIEW_TYPE.BLANK);
        this.frame.setSrc('about:blank');
    }

    private setPreviewType(previewType: PREVIEW_TYPE) {

        if (this.previewType !== previewType) {

            this.getEl().removeClass('image-preview page-preview svg-preview no-preview');

            if (this.previewMessageEl) {
                this.previewMessageEl.remove();
                this.previewMessageEl = null;
            }

            switch (previewType) {
            case PREVIEW_TYPE.PAGE:
            {
                this.getEl().addClass('page-preview');
                break;
            }
            case PREVIEW_TYPE.IMAGE:
            {
                this.getEl().addClass('image-preview');
                break;
            }
            case PREVIEW_TYPE.SVG:
            {
                this.getEl().addClass('svg-preview');
                break;
            }
            case PREVIEW_TYPE.EMPTY:
            {
                this.showPreviewMessage(i18n('field.preview.notAvailable'));
                break;
            }
            case PREVIEW_TYPE.FAILED:
            {
                this.showPreviewMessage(i18n('field.preview.failed'));
                break;
            }
            case PREVIEW_TYPE.BLANK:
            {
                this.getEl().addClass('no-preview');
                break;
            }
            }
        }

        this.previewType = previewType;

        if (PREVIEW_TYPE.FAILED === previewType || PREVIEW_TYPE.EMPTY === previewType) {
            this.hideMask();
        }
    }

    private showPreviewMessage(value: string) {
        this.getEl().addClass('no-preview');

        this.appendChild(this.previewMessageEl = new PEl('no-preview-message').setHtml(value, false));

        this.frame.setSrc('about:blank');
    }

    public showMask() {
        if (this.isVisible()) {
            this.mask.show();
        }
    }

    private hideMask() {
        this.mask.hide();
    }

}
