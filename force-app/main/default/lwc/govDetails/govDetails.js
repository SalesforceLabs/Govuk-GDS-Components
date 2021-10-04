/**
 * Component Name: Gov UK Details
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Harshpreet Singh Chhabra/Brenda Campbell
 **/
import {LightningElement,api} from 'lwc';

export default class GovDetails extends LightningElement {
    @api summaryText;
    @api detailsText;

}