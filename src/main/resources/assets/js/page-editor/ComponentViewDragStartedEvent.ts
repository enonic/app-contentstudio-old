import {ComponentView} from './ComponentView';
import {Component} from '../app/page/region/Component';
import Event = api.event.Event;

export class ComponentViewDragStartedEvent
    extends Event {

    private componentView: ComponentView<Component>;

    constructor(componentView?: ComponentView<Component>) {
        super();
        this.componentView = componentView;
    }

    getComponentView(): ComponentView<Component> {
        return this.componentView;
    }

    static on(handler: (event: ComponentViewDragStartedEvent) => void, contextWindow: Window = window) {
        Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: ComponentViewDragStartedEvent) => void, contextWindow: Window = window) {
        Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }
}
