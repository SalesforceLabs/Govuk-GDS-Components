import {LightningElement,api} from 'lwc';

export default class PhaseBanner extends LightningElement {
    @api phaseText;
    @api bodyText;
}