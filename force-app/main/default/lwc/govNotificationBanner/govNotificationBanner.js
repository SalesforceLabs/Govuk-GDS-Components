import {LightningElement, api} from 'lwc';

export default class GovNotificationBanner extends LightningElement {
    @api headingText;
    @api bodyText;
}