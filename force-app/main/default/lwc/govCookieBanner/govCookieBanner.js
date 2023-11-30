import { LightningElement, api } from 'lwc';
import { publish, createMessageContext, MessageContext } from 'lightning/messageService';
import COOKIES_ACCEPT_CHANNEL from '@salesforce/messageChannel/CookiesAccept__c';

export default class GovCookieBanner extends  LightningElement {

    isVisible;
    @api label;    
    @api cookiePageUrl;
    @api acceptLabel;
    @api rejectLabel;
    @api bannerContent;
    @api preferencesSetCookieName;
    @api optionalCookieNames;

    messageContext = createMessageContext();

    connectedCallback() {

        //check cookie
        this.setIsVisible();
    }

    accept() {
        this.setRecommendedCookies(true);
    }

    reject() {
        this.setRecommendedCookies(false);
    }

    setRecommendedCookies(accept){
        const payload = { 
            acceptRecommended: accept
          };
          publish(this.messageContext, COOKIES_ACCEPT_CHANNEL, payload);

        //set the preferences set cookie
        this.setCookie(this.preferencesSetCookieName,true,365);

        //hide the banner - cookie manager should then set cookie to hide it next time
        this.setIsVisible();
    }

    getCookie(name) {
        // Split cookie string and get all individual name=value pairs in an array
        var cookieArr = document.cookie.split(";");
        
        // Loop through the array elements
        for(var i = 0; i < cookieArr.length; i++) {
            var cookiePair = cookieArr[i].split("=");
            
            /* Removing whitespace at the beginning of the cookie name
            and compare it with the given string */
            if(name == cookiePair[0].trim()) {
                // Decode the cookie value and return
                return decodeURIComponent(cookiePair[1]);
            }
        }
        
        // Return null if not found
        return null;
    }

    setCookie(name, value, daysToLive) {
        // Encode value in order to escape semicolons, commas, and whitespace
        var cookie = name + "=" + encodeURIComponent(value);
        
        if(typeof daysToLive === "number") {
            /* Sets the max-age attribute so that the cookie expires
            after the specified number of days */
            cookie += "; max-age=" + (daysToLive*24*60*60);
            
            document.cookie = cookie;
        }
    }

    setIsVisible(){
        if(this.getCookie(this.preferencesSetCookieName)=='true'){
            this.isVisible = false;
        } else {
            this.isVisible = true;
        }
    }

    //getters for button visibility etc
    get isAcceptButtonVisible(){
        return !(this.acceptLabel=='');
    }

    get isRejectButtonVisible(){
        return !(this.rejectLabel=='');
    }

    get isCookiesPageLinkVisible(){
        return !(this.cookiePageUrl=='');
    }

}