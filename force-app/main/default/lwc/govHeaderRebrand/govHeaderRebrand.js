import {LightningElement, api} from 'lwc';
import {NavigationMixin} from "lightning/navigation";

export default class GovHeaderRebrand  extends NavigationMixin(LightningElement) {
    
    @api serviceURL = "#";

}