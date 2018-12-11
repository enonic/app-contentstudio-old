import {TagRemovedEvent} from './TagRemovedEvent';
import {TagAddedEvent} from './TagAddedEvent';
import {Tag, TagBuilder} from './Tag';
import {TagSuggestions} from './TagSuggestions';
import {TagSuggester} from './TagSuggester';

export class TagsBuilder {

    tagSuggester: TagSuggester;

    tags: string[] = [];

    maxTags: number = 0;

    setTagSuggester(value: TagSuggester): TagsBuilder {
        this.tagSuggester = value;
        return this;
    }

    addTag(value: string): TagsBuilder {
        this.tags.push(value);
        return this;
    }

    setMaxTags(value: number): TagsBuilder {
        this.maxTags = value;
        return this;
    }

    public build(): Tags {
        return new Tags(this);
    }
}

export class Tags
    extends api.dom.FormInputEl {

    private tagSuggester: TagSuggester;

    private textInput: api.ui.text.TextInput;

    private tagSuggestions: TagSuggestions;

    private tags: Tag[] = [];

    private maxTags: number;

    private preservedValue: string;

    private tagAddedListeners: { (event: TagAddedEvent): void }[] = [];

    private tagRemovedListeners: { (event: TagRemovedEvent): void }[] = [];

    constructor(builder: TagsBuilder) {
        super('ul', 'tags', undefined, builder.tags ? builder.tags.join(';') : undefined);
        this.tagSuggester = builder.tagSuggester;

        this.maxTags = builder.maxTags;

        this.textInput = new api.ui.text.TextInput();
        this.textInput.disableAutocomplete();
        this.appendChild(this.textInput);

        this.tagSuggestions = new TagSuggestions();
        this.tagSuggestions.hide();
        this.appendChild(this.tagSuggestions);

        this.textInput.onKeyDown((event: KeyboardEvent) => {
            if (event.keyCode === 188 || event.keyCode === 13) { // comma or enter
                this.handleWordCompleted();
                event.preventDefault();
            } else if (event.keyCode === 8) {
                if (!this.textInput.getValue() && this.countTags() > 0) {
                    this.doRemoveTag(this.tags[this.countTags() - 1]);
                }
            } else if (event.keyCode === 38) {
                if (this.tagSuggestions.isVisible()) {
                    this.tagSuggestions.moveUp();
                    event.preventDefault();
                }
            } else if (event.keyCode === 40) {
                if (this.tagSuggestions.isVisible()) {
                    this.tagSuggestions.moveDown();
                    event.preventDefault();
                }
            }
        });

        this.tagSuggestions.onSelected((value: string) => {
            // call ElementHelper.setValue to avoid firing ValueChangedEvent
            this.textInput.getEl().setValue(value || this.preservedValue);

            if (value) {
                this.textInput.selectText(this.preservedValue.length, value.length);
            }
        });

        this.textInput.onBlur(() => {
            this.handleWordCompleted();
            // when tags are fill line an empty input moves to next line its looks ugly for inactive field
            // set small input width to leave it on the same line
            // (we can't just hide input cause it couldn't get focus then)
            this.textInput.getEl().setValue('').setWidthPx(1);
        });

        this.textInput.onFocus(() => {
            this.textInput.getEl().setWidth('');
        });

        let searchSuggestionHandler = api.util.AppHelper.debounce((searchString: string) => {
            this.searchSuggestions(searchString);
        }, 300, false);

        this.textInput.onValueChanged((event: api.ValueChangedEvent) => {
            let searchString = event.getNewValue();

            if (api.util.StringHelper.isBlank(searchString)) {
                this.tagSuggestions.hide();
            } else {
                searchSuggestionHandler(searchString);
            }
        });

        this.onClicked(() => {
            // restore input width to default
            this.textInput.getEl().setWidth('');
            this.textInput.giveFocus();
        });

        this.onTagAdded(() => {
            this.refreshDirtyState();
            this.refreshValueChanged();
        });
        this.onTagRemoved(() => {
            this.refreshDirtyState();
            this.refreshValueChanged();
        });
    }

    private searchSuggestions(searchString: string) {
        this.tagSuggester.suggest(searchString).then((values: string[]) => {
            if (searchString !== this.textInput.getValue()) {
                // if input text changed during the request, cancel suggestions
                return;
            }

            let existingValues = this.doGetTags().concat(searchString);
            values = values.filter((value: string) => (existingValues.indexOf(value) < 0));

            if (values.length === 0) {
                this.tagSuggestions.hide();
            } else {
                this.tagSuggestions.setTags(values);
                this.tagSuggestions.getEl().setTopPx(this.textInput.getEl().getOffsetToParent().top +
                                                     this.textInput.getEl().getHeightWithMargin()).setLeftPx(
                    this.textInput.getEl().getOffsetToParent().left);
                this.tagSuggestions.show();
                this.preservedValue = searchString;
            }
        }).catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
            return [];
        }).done();
    }

    private handleWordCompleted() {
        let inputValue = this.textInput.getValue();
        let word = inputValue.trim();

        let tag = this.doAddTag(word);
        if (tag) {
            this.textInput.setValue('');

            if (this.isMaxTagsReached()) {
                this.textInput.hide();
            }
            this.tagSuggestions.hide();
        }
    }

    private doClearTags(silent?: boolean) {
        // use tags copy because doRemoveTag modifies tags array
        this.tags.slice().forEach((tag) => this.doRemoveTag(tag, silent));
    }

    private doAddTag(value: string, silent?: boolean): Tag {
        if (this.indexOf(value) > -1 || !value) {
            return null;
        }

        let tag = new TagBuilder().setValue(value).setRemovable(true).build();
        this.tags.push(tag);
        tag.insertBeforeEl(this.textInput);

        tag.onRemoveClicked(() => this.doRemoveTag(tag));

        if (this.isMaxTagsReached()) {
            this.textInput.hide();
        }

        if (!silent) {
            this.notifyTagAdded(new TagAddedEvent(tag.getValue()));
        }

        return tag;
    }

    private doRemoveTag(tag: Tag, silent?: boolean) {
        let index = this.indexOf(tag.getValue());
        if (index >= 0) {
            tag.remove();
            this.tags.splice(index, 1);

            if (!this.textInput.isVisible() && !this.isMaxTagsReached()) {
                this.textInput.setVisible(true);
            }
            this.textInput.giveFocus();

            if (!silent) {
                this.notifyTagRemoved(new TagRemovedEvent(tag.getValue(), index));
            }
        }
    }

    private indexOf(value: string): number {
        if (!api.util.StringHelper.isEmpty(value)) {
            for (let i = 0; i < this.tags.length; i++) {
                if (value === this.tags[i].getValue()) {
                    return i;
                }

            }
        }
        return -1;
    }

    resetPropertyValues() {
        const tags = this.doGetTags();
        if (tags.length > 0) {

            this.doClearTags(true);
            tags.forEach(tag => this.doAddTag(tag));
        }
    }

    countTags(): number {
        return this.tags.length;
    }

    protected doGetValue(): string {
        return this.doGetTags().join(';');
    }

    protected doSetValue(value: string) {
        this.doClearTags(true);
        value.split(';').forEach((tag) => this.doAddTag(tag, true));
    }

    private doGetTags(): string[] {
        return this.tags.map((tag: Tag) => tag.getValue());
    }

    isMaxTagsReached(): boolean {
        if (this.maxTags === 0) {
            return false;
        }
        return this.countTags() >= this.maxTags;
    }

    onTagAdded(listener: (event: TagAddedEvent) => void) {
        this.tagAddedListeners.push(listener);
    }

    unTagAdded(listener: (event: TagAddedEvent) => void) {
        this.tagAddedListeners.push(listener);
    }

    private notifyTagAdded(event: TagAddedEvent) {
        this.tagAddedListeners.forEach((listener: (event: TagAddedEvent) => void) => {
            listener(event);
        });
    }

    onTagRemoved(listener: (event: TagRemovedEvent) => void) {
        this.tagRemovedListeners.push(listener);
    }

    unTagRemoved(listener: (event: TagRemovedEvent) => void) {
        this.tagRemovedListeners.push(listener);
    }

    giveFocus(): boolean {
        if (this.isMaxTagsReached()) {
            return this.tags[0].giveFocus();
        } else {
            // restore input width to default
            this.textInput.getEl().setWidth('');
            return this.textInput.giveFocus();
        }
    }

    private notifyTagRemoved(event: TagRemovedEvent) {
        this.tagRemovedListeners.forEach((listener: (event: TagRemovedEvent) => void) => {
            listener(event);
        });
    }

}
