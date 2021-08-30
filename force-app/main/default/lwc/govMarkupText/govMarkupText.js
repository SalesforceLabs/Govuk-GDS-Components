/**
 * Component Name: Gov UK Markup Text
 * Version: X.X.XX
 * Created by: Neetesh Jain
 **/
import { LightningElement,api } from 'lwc';

export default class GovMarkupText extends LightningElement {
    @api markupText;
    @api initialised;

    renderedCallback() {
        if(this.initialised) {
            return;
        }
        const htmlElement = this.template.querySelector(".html-element");
        if(htmlElement) {
            htmlElement.innerHTML = this.markupText;
            this.initialised = true;
        }
    }
}