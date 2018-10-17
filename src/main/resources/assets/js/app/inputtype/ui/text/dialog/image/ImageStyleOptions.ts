import Option = api.ui.selector.Option;
import {Styles} from '../../styles/Styles';
import {Style, StyleType} from '../../styles/Style';

export class ImageStyleOption {

    private name: string;

    private displayName: string;

    private empty: boolean;

    constructor(imageStyle: Style) {
        this.name = imageStyle.getName();
        this.displayName = imageStyle.getDisplayName();
        this.empty = imageStyle.isEmpty();
    }

    getName(): string {
        return this.name;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    isEmpty(): boolean {
        return this.empty;
    }
}

export class ImageStyleOptions {

    private static getEmptyOption(): Option<ImageStyleOption> {
        return ImageStyleOptions.getOption(Style.getEmpty(StyleType.IMAGE));
    }

    private static getOption(imageStyle: Style): Option<ImageStyleOption> {

        const imageStyleOption = new ImageStyleOption(imageStyle);

        return {
            value: imageStyleOption.getName(),
            displayValue: imageStyleOption
        }
    }

    static getOptions(): Option<ImageStyleOption>[] {

        const options: Option<ImageStyleOption>[] = [ImageStyleOptions.getEmptyOption()];

        Styles.getForImage().forEach((imageStyle: Style) => {
            options.push(ImageStyleOptions.getOption(imageStyle));
        });

        return options;
    }

}