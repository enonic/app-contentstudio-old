import {WidgetItemView} from '../../WidgetItemView';
import {GetContentAttachmentsRequest} from '../../../../resource/GetContentAttachmentsRequest';
import {Attachments} from '../../../../attachment/Attachments';
import {Attachment} from '../../../../attachment/Attachment';
import {AttachmentName} from '../../../../attachment/AttachmentName';
import {Content} from '../../../../content/Content';
import ContentSummary = api.content.ContentSummary;
import ContentId = api.content.ContentId;
import i18n = api.util.i18n;

export class AttachmentsWidgetItemView extends WidgetItemView {

    private content: ContentSummary;

    private list: api.dom.UlEl;

    private placeholder: api.dom.SpanEl;

    public static debug: boolean = false;

    constructor() {
        super('attachments-widget-item-view');
    }

    public setContentAndUpdateView(content: Content): wemQ.Promise<any> {
        if (AttachmentsWidgetItemView.debug) {
            console.debug('AttachmentsWidgetItemView.setContent: ', content);
        }
        if (!api.ObjectHelper.equals(content, this.content)) {
            this.content = content;
            return this.layout();
        }
        return wemQ<any>(null);
    }

    public layout(): wemQ.Promise<any> {
        if (AttachmentsWidgetItemView.debug) {
            console.debug('AttachmentsWidgetItemView.layout');
        }

        return super.layout().then(() => {
            if (this.content != null) {
                return this.layoutAttachments();
            } else {
                this.removeChildren();
            }
        });
    }

    private layoutAttachments(): wemQ.Promise<Attachments> {
        return new GetContentAttachmentsRequest(this.content.getContentId()).sendAndParse().then(
            (attachments: Attachments) => {

                if (this.hasChild(this.list)) {
                    this.removeChild(this.list);
                }

                if (this.hasChild(this.placeholder)) {
                    this.removeChild(this.placeholder);
                }

                if (attachments) {
                    this.list = new api.dom.UlEl('attachment-list');

                    let contentId = this.content.getContentId();
                    attachments.forEach((attachment: Attachment) => {
                        let attachmentContainer = new api.dom.LiEl('attachment-container');
                        let link = this.createLinkEl(contentId, attachment.getName());
                        attachmentContainer.appendChild(link);
                        this.list.appendChild(attachmentContainer);

                    });

                    this.appendChild(this.list);

                } else {
                    this.placeholder = new api.dom.SpanEl('att-placeholder').setHtml(i18n('field.widget.noAttachments'));
                    this.appendChild(this.placeholder);
                }

                return attachments;
            });
    }

    private createLinkEl(contentId: ContentId, attachmentName: AttachmentName): api.dom.AEl {
        let name = encodeURIComponent(attachmentName.toString());
        let url = `content/media/${contentId.toString()}/${name}`;
        let link = new api.dom.AEl().setUrl(api.util.UriHelper.getRestUri(url), '_blank');
        link.setHtml(attachmentName.toString());
        return link;
    }

}
