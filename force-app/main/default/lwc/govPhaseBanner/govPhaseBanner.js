/**
 * Component Name: Gov UK Phase Banner
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Harshpreet Singh Chhabra/Brenda Campbell
 **/
import {LightningElement,api} from 'lwc';

export default class PhaseBanner extends LightningElement {
    @api phaseText;
    @api bodyText;
}