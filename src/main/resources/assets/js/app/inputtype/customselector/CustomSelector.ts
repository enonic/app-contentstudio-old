import PropertyArray = api.data.PropertyArray;
import Value = api.data.Value;
import ValueType = api.data.ValueType;
import ValueTypes = api.data.ValueTypes;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;
import StringHelper = api.util.StringHelper;
import UriHelper = api.util.UriHelper;
import RichComboBox = api.ui.selector.combobox.RichComboBox;
import SelectedOptionsView = api.ui.selector.combobox.SelectedOptionsView;
import SelectedOption = api.ui.selector.combobox.SelectedOption;
import {CustomSelectorItem} from './CustomSelectorItem';
import {CustomSelectorComboBox} from './CustomSelectorComboBox';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';

export class CustomSelector
    extends api.form.inputtype.support.BaseInputTypeManagingAdd {

    public static debug: boolean = false;

    private static portalUrl: string = UriHelper.getPortalUri('/edit/draft{0}/_/service/{1}');

    private requestPath: string;

    private comboBox: RichComboBox<CustomSelectorItem>;

    constructor(context: ContentInputTypeViewContext) {
        super('custom-selector');

        if (CustomSelector.debug) {
            console.debug('CustomSelector: config', context.inputConfig);
        }

        this.readConfig(context);
    }

    private readConfig(context: ContentInputTypeViewContext): void {
        const cfg = context.inputConfig;
        const serviceCfg = cfg['service'];
        let serviceUrl;
        if (serviceCfg) {
            serviceUrl = serviceCfg[0] ? serviceCfg[0]['value'] : undefined;
        }
        const serviceParams = cfg['param'] || [];
        const contentPath = context.contentPath.toString();

        const params = serviceParams.reduce((prev, curr) => {
            prev[curr['@value']] = curr['value'];
            return prev;
        }, {});

        if (serviceUrl) {
            this.requestPath =
                StringHelper.format(CustomSelector.portalUrl, contentPath, UriHelper.appendUrlParams(serviceUrl, params));
        }
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    newInitialValue(): Value {
        return ValueTypes.STRING.newNullValue();
    }

    layout(input: api.form.Input, propertyArray: PropertyArray): wemQ.Promise<void> {
        if (!ValueTypes.STRING.equals(propertyArray.getType())) {
            propertyArray.convertValues(ValueTypes.STRING);
        }
        super.layout(input, propertyArray);

        this.comboBox = this.createComboBox(input, propertyArray);

        this.appendChild(this.comboBox);

        this.setupSortable();
        this.setLayoutInProgress(false);

        return wemQ<void>(null);
    }

    update(propertyArray: api.data.PropertyArray, unchangedOnly?: boolean): Q.Promise<void> {
        const superPromise = super.update(propertyArray, unchangedOnly);

        if (!unchangedOnly || !this.comboBox.isDirty()) {
            return superPromise.then(() => {
                this.comboBox.setValue(this.getValueFromPropertyArray(propertyArray));
            });
        } else if (this.comboBox.isDirty()) {
            this.comboBox.forceChangedEvent();
        }
        return superPromise;
    }

    reset() {
        this.comboBox.resetBaseValues();
    }

    createComboBox(input: api.form.Input, propertyArray: PropertyArray): RichComboBox<CustomSelectorItem> {

        let comboBox = new CustomSelectorComboBox(input, this.requestPath, this.getValueFromPropertyArray(propertyArray));
        /*
         comboBox.onOptionFilterInputValueChanged((event: api.ui.selector.OptionFilterInputValueChangedEvent<string>) => {
         comboBox.setFilterArgs({searchString: event.getNewValue()});
         });
         */
        comboBox.onOptionSelected((event: SelectedOptionEvent<CustomSelectorItem>) => {
            this.ignorePropertyChange = true;

            const option = event.getSelectedOption();
            let value = new Value(String(option.getOption().value), ValueTypes.STRING);
            if (option.getIndex() >= 0) {
                this.getPropertyArray().set(option.getIndex(), value);
            } else {
                this.getPropertyArray().add(value);
            }
            this.refreshSortable();

            this.ignorePropertyChange = false;
            this.validate(false);

            this.fireFocusSwitchEvent(event);
        });
        comboBox.onOptionDeselected((event: SelectedOptionEvent<CustomSelectorItem>) => {
            this.ignorePropertyChange = true;

            this.getPropertyArray().remove(event.getSelectedOption().getIndex());

            this.refreshSortable();
            this.ignorePropertyChange = false;
            this.validate(false);
        });

        comboBox.onValueLoaded(() => this.validate(false));

        return comboBox;
    }

    protected getNumberOfValids(): number {
        return this.comboBox.countSelected();
    }

    giveFocus(): boolean {
        if (this.comboBox.maximumOccurrencesReached()) {
            return false;
        }
        return this.comboBox.giveFocus();
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.comboBox.onFocus(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.comboBox.unFocus(listener);
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.comboBox.onBlur(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.comboBox.unBlur(listener);
    }

    private setupSortable() {
        this.updateSelectedOptionStyle();
        this.getSelectedOptionsView().onOptionMoved(this.handleMove.bind(this));
    }

    private handleMove(moved: SelectedOption<any>, fromIndex: number) {
        this.getPropertyArray().move(fromIndex, moved.getIndex());
    }

    private refreshSortable() {
        this.updateSelectedOptionStyle();
        this.getSelectedOptionsView().refreshSortable();
    }

    private getSelectedOptionsView(): SelectedOptionsView<CustomSelectorItem> {
        this.updateSelectedOptionStyle();
        return <SelectedOptionsView<CustomSelectorItem>> this.comboBox.getSelectedOptionView();
    }

    private updateSelectedOptionStyle() {
        if (this.getPropertyArray().getSize() > 1) {
            this.addClass('multiple-occurrence').removeClass('single-occurrence');
        } else {
            this.addClass('single-occurrence').removeClass('multiple-occurrence');
        }
    }
}

api.form.inputtype.InputTypeManager.register(new api.Class('CustomSelector', CustomSelector));
