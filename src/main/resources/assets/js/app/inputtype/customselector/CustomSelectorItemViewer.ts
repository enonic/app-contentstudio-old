import NamesAndIconViewer = api.ui.NamesAndIconViewer;
import {CustomSelectorItem} from './CustomSelectorItem';

export class CustomSelectorItemViewer
    extends NamesAndIconViewer<CustomSelectorItem> {

    constructor() {
        super('custom-selector-item-viewer');
    }

    resolveDisplayName(object: CustomSelectorItem): string {
        return object.displayName;
    }

    resolveSubName(object: CustomSelectorItem): string {
        return object.description;
    }

    resolveIconEl(object: CustomSelectorItem): api.dom.Element {
        if (object.icon && object.icon.data) {
            return api.dom.Element.fromString(object.icon.data);
        }
        return null;
    }

    resolveIconUrl(object: CustomSelectorItem): string {
        return object.iconUrl;
    }
}
