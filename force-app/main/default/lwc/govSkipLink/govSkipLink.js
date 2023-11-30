import {LightningElement, api} from 'lwc';
import SkiplinkLabel from '@salesforce/label/c.uxg_Skiplink_label';

export default class GovSkipLink extends LightningElement {

    @api
    label = SkiplinkLabel;

    @api 
    targetAnchor;

}