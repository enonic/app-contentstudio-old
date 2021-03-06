import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import ApplicationKey = api.application.ApplicationKey;
import {DescriptorBasedDropdown} from '../DescriptorBasedDropdown';
import {LayoutDescriptorLoader} from './LayoutDescriptorLoader';
import {DescriptorViewer} from '../DescriptorViewer';

export class LayoutDescriptorDropdown
    extends DescriptorBasedDropdown<LayoutDescriptor> {

    protected loader: LayoutDescriptorLoader;

    constructor() {

        super({
            optionDisplayValueViewer: new DescriptorViewer<LayoutDescriptor>(),
            dataIdProperty: 'value',
            noOptionsText: 'No layouts available'
        });
    }

    loadDescriptors(applicationKeys: ApplicationKey[]) {
        this.loader.setApplicationKeys(applicationKeys);

        super.load();
    }

    protected createLoader(): LayoutDescriptorLoader {
        return new LayoutDescriptorLoader();
    }
}
