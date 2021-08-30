/**
 * Component Name: Gov UK Phase Banner
 * Version: X.X.XX
 * Created by: Harshpreet Singh Chhabra
 **/
import {LightningElement,api} from 'lwc';

export default class PhaseBanner extends LightningElement {
    @api phaseText;
    @api bodyText;
}