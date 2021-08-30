import { LightningElement, api } from 'lwc';
import { FlowNavigationBackEvent } from 'lightning/flowSupport';
import { NavigationMixin } from 'lightning/navigation';

export default class GovBackButtone extends NavigationMixin(LightningElement) {

    @api availableActions = [];
    @api backButtonLabel = 'Back';
    @api backAction  = false;
    @api destinationPageName = '';
    
    backAvailable = false;

    connectedCallback() {
        if (this.availableActions.find(action => action === 'BACK')) {
            this.backAvailable = true;
        }
    }

    handleBack(event) {
        event.preventDefault();
        if(this.backAvailable && this.backAction) {
            if (this.availableActions.find(action => action === 'BACK')) {
                const navigateBackEvent = new FlowNavigationBackEvent();
                this.dispatchEvent(navigateBackEvent);
            }
        } else {
            if(this.destinationPageName) {
                this[NavigationMixin.Navigate]({
                    type: 'comm__namedPage',
                    attributes: {
                        name: this.destinationPageName
                    },
                    state: {
                    }
                });
            }
        }
    }

    get isVisible() {
        if(this.backAvailable && this.backAction) {
            return true;
        } else if(this.destinationPageName) {
            return true;
        } 
        return false;
    }

}