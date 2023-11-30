import { LightningElement, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
export default class ReactiveComponentListener extends LightningElement {
    @api value;
    @api label;

    handleChange(event) {
        this.name = event.target.value;
        this.dispatchEvent(new FlowAttributeChangeEvent('value', this.value));
    }
}