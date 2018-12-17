import LinkEl = api.dom.LinkEl;
import {Content} from '../../content/Content';

export class WidgetItemView extends api.dom.DivEl {

    public static debug: boolean = false;

    constructor(className?: string) {
        super('widget-item-view' + (className ? ' ' + className : ''));
    }

    public layout(): wemQ.Promise<any> {
        if (WidgetItemView.debug) {
            console.debug('WidgetItemView.layout: ', this);
        }
        return wemQ<any>(null);
    }

    public setContentAndUpdateView(item: Content): wemQ.Promise<any> {
        return wemQ<any>(null);
    }

    private getFullWidgetUrl(url: string, contentId: string) {
        return `${url}?contentId=${contentId}&t=${new Date().getTime()}`;
    }

    public setUrl(url: string, contentId: string): wemQ.Promise<void> {
        let deferred = wemQ.defer<void>();
        let linkEl = new LinkEl(this.getFullWidgetUrl(url, contentId)).setAsync();
        let el = this.getEl();
        let onLinkLoaded = ((event: UIEvent) => {
                const mainContainer = event.target['import'].querySelector('widget');
                if (mainContainer) {
                    el.appendChild(mainContainer);
                }
                linkEl.remove();
                deferred.resolve(null);
            });

        this.removeChildren();
        linkEl.onLoaded(onLinkLoaded);
        document.head.appendChild(linkEl.getHTMLElement());

        return deferred.promise;
    }
}
