import {LightningElement, api, track} from 'lwc';

export default class GovNotificationBanner extends LightningElement {
    @api headingText;
    @api bodyText;
    @api successVariant = false;

   

    get successVariantClass(){
        
        return (this.successVariant) ? 'govuk-notification-banner govuk-notification-banner--success' : 'govuk-notification-banner';
    }
}