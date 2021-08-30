/**
 * Component Name: Gov UK Panel
 * Version: X.X.XX
 * Created by: Harshpreet Singh Chhabra
 **/
import {LightningElement,api} from 'lwc';

export default class GovPanel extends LightningElement {
    @api titleText;
    @api bodyText;

    connectedCallback() {
    }

}