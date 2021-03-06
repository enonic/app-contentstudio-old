import {ContentWizardStepForm} from './ContentWizardStepForm';
import {XDataName} from '../content/XDataName';
import {XData} from '../content/XData';
import Form = api.form.Form;
import FormView = api.form.FormView;
import PropertyTree = api.data.PropertyTree;

export class XDataWizardStepForm
    extends ContentWizardStepForm {

    private xDataName: XDataName;

    private optional: boolean;

    private enabled: boolean;

    private stashedData: PropertyTree;

    private enableChangedListeners: { (value: boolean): void }[] = [];

    constructor(xData: XData) {
        super();
        this.addClass('x-data-wizard-step-form');

        this.xDataName = xData.getXDataName();
        this.optional = xData.isOptional();
    }

    getXDataName(): XDataName {
        return this.xDataName;
    }

    setExpandState(value: boolean) {
        this.setEnabled(value);
    }

    isExpandable(): boolean {
        return this.optional;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    isOptional(): boolean {
        return this.optional;
    }

    resetData() {
        this.data.getRoot().reset();
        this.stashedData = null;
    }

    resetForm(): wemQ.Promise<void> {
        this.resetData();

        return this.enabled ? this.doLayout(this.form, this.data) : wemQ(null);
    }

    protected doLayout(form: Form, data: PropertyTree): wemQ.Promise<void> {
        if (this.enabled === undefined) {
            this.resetState(data);
        }

        if (this.enabled) {
            return super.doLayout(form, data).then(() => {
                this.validate(false);
            });
        } else {
            this.formView = new FormView(this.formContext, form, data.getRoot());
        }

        return wemQ(null);
    }

    update(data: PropertyTree, unchangedOnly: boolean = true): wemQ.Promise<void> {
        return super.update(data, unchangedOnly);
    }

    resetState(data?: PropertyTree): wemQ.Promise<void> {
        this.data = data || this.data;
        return this.setEnabled(!this.optional || this.data.getRoot().getSize() > 0, true).then(() => {
            this.resetHeaderState();
        });
    }

    resetHeaderState() {
        if (this.outerHeader) {
            this.outerHeader.setTogglerState(this.enabled, true);
        }
    }

    private setHeaderState(enabled: boolean, silent: boolean = false) {
        if (this.outerHeader) {
            this.outerHeader.setTogglerState(enabled, silent);
        }
    }

    private setEnabled(value: boolean, silent: boolean = false): wemQ.Promise<void> {
        let changed: boolean = value !== this.enabled;
        this.enabled = value;

        this.enabled ? this.show() : this.hide();

        if (!changed) {
            return wemQ(null);
        }

        let promise: wemQ.Promise<void>;
        if (this.enabled) {
            if (this.form && this.data) {
                if (this.stashedData) {
                    this.data.getRoot().addPropertiesFromSet(this.stashedData.getRoot());
                }
                promise = this.doLayout(this.form, this.data);
            }
        } else {
            if (this.data) {
                this.stashedData = this.data.copy();
                this.data.getRoot().removeAllProperties();
            }

            if (this.formView) {
                this.formView.remove();
                this.formView = new FormView(this.formContext, this.form, this.data.getRoot());

                this.resetValidation();
            }
        }

        this.setHeaderState(this.enabled, true);

        if (!silent) {
            this.notifyEnableChanged(value);
        }

        return promise || wemQ(null);
    }

    onEnableChanged(listener: (value: boolean) => void) {
        this.enableChangedListeners.push(listener);
    }

    unEnableChanged(listener: (value: boolean) => void) {
        this.enableChangedListeners = this.enableChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyEnableChanged(value: boolean) {
        this.enableChangedListeners.forEach((listener) => {
            listener(value);
        });
    }
}
