import {LightningElement,api} from 'lwc';

export default class GovPanel extends LightningElement {
    @api titleText;
    @api bodyText;

    connectedCallback() {
    }

}