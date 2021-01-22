/**
 * Created by simon.cook on 03/12/2020.
 */

import {LightningElement,api} from 'lwc';

export default class GovDetails extends LightningElement {
    @api summaryText;
    @api detailsText;

}