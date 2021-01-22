import { LightningElement,api } from 'lwc';

export default class GovDisplayHtml extends LightningElement {
    @api html;
    @api initialised;

    renderedCallback() {
        if(this.initialised) {
            return;
        }
        const htmlElement = this.template.querySelector(".html-element");
        if(htmlElement) {
            htmlElement.innerHTML = this.html;
            this.initialised = true;
        }
    }
}