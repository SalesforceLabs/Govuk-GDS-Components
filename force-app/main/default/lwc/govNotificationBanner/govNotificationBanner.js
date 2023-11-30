/**
 * Component Name: Gov UK Notification Banner
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Harshpreet Singh Chhabra/Brenda Campbell
 **/
import {LightningElement, api, track} from 'lwc';

export default class GovNotificationBanner extends LightningElement {
    @api headingText;
    @api bodyText;
    @api successVariant = false;
   

    get successVariantClass(){
        
        return (this.successVariant) ? 'govuk-notification-banner govuk-notification-banner--success' : 'govuk-notification-banner';
    }

    get role(){

        return (this.successVariant) ? 'alert' : 'region';

    }
    get markdownString() {
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(this.bodyText, 'text/html');
        const bodyElement = htmlDoc.body;
        
        return bodyElement.innerText;
    }

    get role(){

        return (this.successVariant) ? 'alert' : 'region';

    }
}