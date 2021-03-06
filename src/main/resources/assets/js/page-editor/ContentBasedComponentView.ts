import {ComponentView, ComponentViewBuilder} from './ComponentView';
import {DragAndDrop} from './DragAndDrop';
import {EditContentEvent} from '../app/event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from '../app/content/ContentSummaryAndCompareStatus';
import {Component} from '../app/page/region/Component';
import ContentSummary = api.content.ContentSummary;
import ContentSummaryBuilder = api.content.ContentSummaryBuilder;
import ContentTypeName = api.schema.content.ContentTypeName;
import i18n = api.util.i18n;
import ContentId = api.content.ContentId;

export class ContentBasedComponentViewBuilder<COMPONENT extends Component>
    extends ComponentViewBuilder<COMPONENT> {

    contentTypeName: ContentTypeName;

    setContentTypeName(contentTypeName: ContentTypeName): ContentBasedComponentViewBuilder<COMPONENT> {
        this.contentTypeName = contentTypeName;
        return this;
    }
}

export class ContentBasedComponentView<COMPONENT extends Component>
    extends ComponentView<COMPONENT> {

    private contentTypeName: ContentTypeName;

    constructor(builder: ContentBasedComponentViewBuilder<COMPONENT>) {
        super(builder);

        this.contentTypeName = builder.contentTypeName;

        this.addEditActionToMenu();
    }

    protected isDragging(): boolean {
        return DragAndDrop.get().isDragging();
    }

    private addEditActionToMenu() {
        if (!this.isEmpty()) {
            this.addContextMenuActions([this.createEditAction()]);
        }
    }

    private createEditAction(): api.ui.Action {
        return new api.ui.Action(i18n('action.edit')).onExecuted(() => {
            new EditContentEvent([this.generateContentSummaryAndCompareStatus()]).fire();
        });
    }

    private generateContentSummaryAndCompareStatus() {
        const contentId: ContentId = this.getContentId();
        const contentSummary: ContentSummary = new ContentSummaryBuilder().setId(contentId.toString()).setContentId(contentId).setType(
            this.contentTypeName).build();

        return ContentSummaryAndCompareStatus.fromContentSummary(contentSummary);
    }

    protected getContentId(): ContentId {
        throw new Error('Must be implemented by inheritors');
    }
}
