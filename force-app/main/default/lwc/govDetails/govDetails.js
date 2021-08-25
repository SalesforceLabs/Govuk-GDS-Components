import {LightningElement,api} from 'lwc';

export default class GovDetails extends LightningElement {
    @api summaryText;
    @api detailsText;

}