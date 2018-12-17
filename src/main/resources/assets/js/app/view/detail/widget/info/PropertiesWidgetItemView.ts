import {WidgetItemView} from '../../WidgetItemView';
import {Content} from '../../../../content/Content';
import ContentSummary = api.content.ContentSummary;
import DateTimeFormatter = api.ui.treegrid.DateTimeFormatter;
import Application = api.application.Application;
import i18n = api.util.i18n;

export class PropertiesWidgetItemView extends WidgetItemView {

    private content: ContentSummary;

    private list: api.dom.DlEl;

    public static debug: boolean = false;

    constructor() {
        super('properties-widget-item-view');
    }

    public setContentAndUpdateView(content: Content): wemQ.Promise<any> {
        if (!content.equals(this.content)) {
            this.content = content;
            return this.layout();
        }

        return wemQ<any>(null);
    }

    public layout(): wemQ.Promise<any> {
        if (PropertiesWidgetItemView.debug) {
            console.debug('PropertiesWidgetItemView.layout');
        }

        return super.layout().then(() => {
            if (this.content != null) {
                let applicationKey = this.content.getType().getApplicationKey();
                if (!applicationKey.isSystemReserved()) {
                    return new api.application.GetApplicationRequest(applicationKey).sendAndParse().then((application: Application) => {
                        this.layoutApplication(application);
                    }).catch(() => {
                        this.layoutApplication();
                    });
                } else {
                    this.layoutApplication();
                }
            }
        });
    }

    private layoutApplication(application?: Application) {

        if (this.hasChild(this.list)) {
            this.removeChild(this.list);
        }
        this.list = new api.dom.DlEl();

        let strings: FieldString[];

        strings = [
            new FieldString().setName(i18n('field.type')).setValue(this.content.getType().getLocalName()
                ? this.content.getType().getLocalName() : this.content.getType().toString()),

            new FieldString().setName(i18n('field.app')).setValue(
                application ? application.getDisplayName() : this.content.getType().getApplicationKey().getName()),

            this.content.getLanguage() ? new FieldString().setName(i18n('field.lang')).setValue(this.content.getLanguage()) : null,

            this.content.getOwner() ? new FieldString().setName(i18n('field.owner')).setValue(this.content.getOwner().getId()) : null,

            new FieldString().setName(i18n('field.created')).setValue(DateTimeFormatter.createHtml(this.content.getCreatedTime())),

            this.content.getModifiedTime() ? new FieldString().setName(i18n('field.modified')).setValue(
                DateTimeFormatter.createHtml(this.content.getModifiedTime())) : null,

            this.content.getPublishFirstTime() ? new FieldString().setName(i18n('field.firstPublished')).setValue(
                DateTimeFormatter.createHtml(this.content.getPublishFirstTime())) : null,

            this.content.getPublishFromTime() ? new FieldString().setName(i18n('field.publishFrom')).setValue(
                DateTimeFormatter.createHtml(this.content.getPublishFromTime())) : null,

            this.content.getPublishToTime() ? new FieldString().setName(i18n('field.publishTo')).setValue(
                DateTimeFormatter.createHtml(this.content.getPublishToTime())) : null,

            new FieldString().setName(i18n('field.id')).setValue(this.content.getId())
        ];

        strings.forEach((stringItem: FieldString) => {
            if (stringItem) {
                stringItem.layout(this.list);
            }
        });
        this.removeChildren();
        this.appendChild(this.list);
    }
}

class FieldString {

    private fieldName: string;

    private value: string;

    public setName(name: string): FieldString {
        this.fieldName = name;
        return this;
    }

    public setValue(value: string): FieldString {
        this.value = value;
        return this;
    }

    public layout(parentEl: api.dom.Element) {
        let valueEl = new api.dom.DdDtEl('dt').setHtml(this.value);
        let spanEl = new api.dom.DdDtEl('dd').setHtml(this.fieldName + ': ');
        parentEl.appendChildren(spanEl, valueEl);
    }

}
