import '../../api.ts';
import {BeforeContentSavedEvent} from '../event/BeforeContentSavedEvent';
import Form = api.form.Form;
import FormContext = api.form.FormContext;
import FormView = api.form.FormView;
import PropertyTree = api.data.PropertyTree;
import WizardStepValidityChangedEvent = api.app.wizard.WizardStepValidityChangedEvent;

export class ContentWizardStepForm
    extends api.app.wizard.WizardStepForm {

    protected formContext: FormContext;

    protected form: Form;

    protected formView: FormView;

    protected data: PropertyTree;

    constructor() {
        super();

        BeforeContentSavedEvent.on(() => {
            if (this.formView) {
                this.formView.clean();
            }
        });
    }

    update(data: PropertyTree, unchangedOnly: boolean = true): wemQ.Promise<void> {
        this.data = data;
        return this.formView.update(data.getRoot(), unchangedOnly);
    }

    reset() {
        return this.formView.reset();
    }

    layout(formContext: FormContext, data: PropertyTree, form: Form): wemQ.Promise<void> {

        this.formContext = formContext;
        this.form = form;
        this.data = data;
        return this.doLayout(form, data);
    }

    protected doLayout(form: Form, data: PropertyTree): wemQ.Promise<void> {

        if (this.formView) {
            this.formView.remove();
        }

        this.formView = new FormView(this.formContext, form, data.getRoot());
        return this.formView.layout().then(() => {

            this.formView.onFocus((event) => {
                this.notifyFocused(event);
            });
            this.formView.onBlur((event) => {
                this.notifyBlurred(event);
            });

            this.appendChild(this.formView);

            this.formView.onValidityChanged((event: api.form.FormValidityChangedEvent) => {
                this.previousValidation = event.getRecording();
                this.notifyValidityChanged(new WizardStepValidityChangedEvent(event.isValid()));
            });

            if (form.getFormItems().length === 0) {
                this.hide();
            }
        });
    }

    public validate(silent: boolean = false, forceNotify: boolean = false): api.form.ValidationRecording {
        return this.formView.validate(silent, forceNotify);
    }

    public resetValidation() {
        this.previousValidation = new api.form.ValidationRecording();
        this.notifyValidityChanged(new WizardStepValidityChangedEvent(true));
    }

    public displayValidationErrors(display: boolean) {
        this.formView.displayValidationErrors(display);
    }

    getForm(): Form {
        return this.form;
    }

    getFormView(): FormView {
        return this.formView;
    }

    getData(): PropertyTree {

        return this.data;
    }

    giveFocus(): boolean {
        return this.formView.giveFocus();
    }

    toggleHelpText(show?: boolean) {
        this.formView.toggleHelpText(show);
    }

    hasHelpText(): boolean {
        return this.formView.hasHelpText();
    }
}
