/**
 * Component Name: Gov UK Panel
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Harshpreet Singh Chhabra/Brenda Campbell
 **/
import {LightningElement,api} from 'lwc';

export default class GovPanel extends LightningElement {
    @api titleText;
    @api bodyText;

    connectedCallback() {
    }

}