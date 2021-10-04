/**
 * Component Name: Gov UK History Manager
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Neetesh Jain/Brenda Campbell
 **/
import { LightningElement, api } from 'lwc';

export default class GovHistoryManager extends LightningElement {
    @api pageName = "";

    connectedCallback() {
        if(this.pageName !== undefined && this.pageName !== "") {
            const baseURL = window.location.href.split('#')[0];
            history.pushState(null, `${this.pageName}`, baseURL + `#${this.pageName.replaceAll(" ","")}`);
            document.title = this.pageName;
        }
        
    }
}