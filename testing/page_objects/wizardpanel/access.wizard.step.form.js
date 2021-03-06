/**
 * Created on 23.07.2018.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const loaderComboBox = require('../components/loader.combobox');
const xpath = {
    container: `//div[contains(@id,'SecurityWizardStepForm')]`,
    permissionSelector: `//div[contains(@id,'PermissionSelector')]`,
    editPermissionsButton: `//button[contains(@class,'edit-permissions') and child::span[text()='Edit Permissions']]`,
    entryRowByDisplayName:
        displayName => `//div[contains(@id,'AccessControlEntryView') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    toggleByOperationName: operation => `//a[contains(@id,'PermissionToggle') and text()='${operation}']`,
};
const accessStepForm = Object.create(page, {

    editPermissionsButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.editPermissionsButton}`;
        }
    },
    clickOnEditPermissionsButton: {
        value: function (displayName) {
            return this.doClick(this.editPermissionsButton).catch(err => {
                this.saveScreenshot("err_click_on_edit_permissions_button");
                throw new Error('Error when clicking on `Edit Permissions` button! ' + err);
            }).pause(700);
        }
    },
    clickOnEntryRow: {
        value: function (displayName) {
            let entryRow = xpath.entryRowByDisplayName(displayName);
            return this.doClick(entryRow).catch(err => {
                this.saveScreenshot("err_click_on_entry_row_wizard");
                throw new Error('Error when clicking on entry row in wizard! ' + err);
            }).pause(500);
        }
    },
    getPermissionOperations: {
        value: function (principalDisplayName) {
            let selector = xpath.entryRowByDisplayName(principalDisplayName) + xpath.permissionSelector +
                           `//a[contains(@id,'PermissionToggle')]`;
            return this.waitForVisible(selector, appConst.TIMEOUT_2).then(() => {
                return this.getText(selector);
            }).then(result => {
                return [].concat(result).filter(value => value.length > 0);
            });
        }
    },
    isOperationAllowed: {
        value: function (principalDisplayName, operation) {
            let selector = xpath.entryRowByDisplayName(principalDisplayName) + xpath.permissionSelector +
                           xpath.toggleByOperationName(operation);
            return this.waitForVisible(selector, appConst.TIMEOUT_2).then(() => {
                return this.getAttribute(selector, 'class');
            }).then(result => {
                return result.includes('allow');
            });
        }
    },
    isOperationDenied: {
        value: function (principalDisplayName, operation) {
            let selector = xpath.entryRowByDisplayName(principalDisplayName) + xpath.permissionSelector +
                           xpath.toggleByOperationName(operation);
            return this.waitForVisible(selector, appConst.TIMEOUT_2).then(() => {
                return this.getAttribute(selector, 'class');
            }).then(result => {
                return result.includes('deny');
            });
        }
    }
});
module.exports = accessStepForm;


