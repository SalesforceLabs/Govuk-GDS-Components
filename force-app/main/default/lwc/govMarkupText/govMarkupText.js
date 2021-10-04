/**
 * Component Name: Gov UK Markup Text
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Neetesh Jain/Brenda Campbell
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