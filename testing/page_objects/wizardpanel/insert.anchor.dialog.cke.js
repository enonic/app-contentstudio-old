const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const dialog = {
    container: `//div[contains(@id,'AnchorModalDialog')]`,
    insertButton: `//button[contains(@id,'DialogButton') and child::span[text()='Insert']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
};

const insertAnchorModalDialog = Object.create(page, {

    cancelButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.cancelButton}`;
        }
    },
    cancelButtonTop: {
        get: function () {
            return `${dialog.container}` + `${elements.CANCEL_BUTTON_TOP}`;
        }
    },
    insertButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.insertButton}`;
        }
    },
    textInput: {
        get: function () {
            return `${dialog.container}` + `${elements.TEXT_INPUT}`;
        }
    },
    typeInTextInput: {
        value: function (text) {
            return this.typeTextInInput(this.textInput, text).catch(err => {
                this.doCatch('err_insert_anchor', err);
            })
        }
    },
    clickOnCancelButton: {
        value: function () {
            return this.doClick(this.cancelButton);
        }
    },
    clickOnInsertButton: {
        value: function () {
            return this.doClick(this.insertButton).pause(300).catch((err) => {
                this.saveScreenshot('err_click_on_insert_anchor_icon');
                throw new Error('Insert Anchor Dialog, error when click on the Insert button  ' + err);
            });
        }
    },
    clickOnInsertButtonAndWaitForClosed: {
        value: function () {
            return this.doClick(this.insertButton).catch((err) => {
                this.saveScreenshot('err_click_on_insert_anchor_icon');
                throw new Error('Insert Anchor Dialog, error when click on the Insert button  ' + err);
            }).then(() => {
                return this.waitForDialogClosed(appConst.TIMEOUT_3);
            }).catch(err => {
                throw new Error('Insert Anchor Dialog, is not closed in   ' + appConst.TIMEOUT_3 + "   " + err);
            })
        }
    },
    waitForValidationMessage: {
        value: function () {
            return this.waitForVisible(dialog.container + elements.VALIDATION_RECORDING_VIEWER, appConst.TIMEOUT_2).catch(err => {
                return false;
            });
        }
    },
    waitForDialogLoaded: {
        value: function () {
            return this.waitForVisible(this.insertButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_open_insert_anchor_dialog');
                throw new Error('Insert Anchor Dialog should be opened!' + err);
            });
        }
    },
    isDialogOpened: {
        value: function () {
            return this.isVisible(dialog.container);
        }
    },
    waitForDialogClosed: {
        value: function (ms) {
            return this.waitForNotVisible(`${dialog.container}`, ms);
        }
    },
});
module.exports = insertAnchorModalDialog;

