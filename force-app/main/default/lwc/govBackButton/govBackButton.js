/**
 * Created by simon.cook on 22/09/2020.
 */

import {LightningElement,api} from 'lwc';
import {FlowNavigationBackEvent} from 'lightning/flowSupport';
import { NavigationMixin } from 'lightning/navigation';

export default class GovBackButtone extends NavigationMixin(LightningElement) {

    @api availableActions = [];
    @api backAction;
    @api backOnly = false;
    @api destination;

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
            if(this.destination) {
                this[NavigationMixin.Navigate]({
                    type: 'comm__namedPage',
                    attributes: {
                        name: this.destination
                    },
                    state: {
                    }
                });
            }
        }
    }

    get isVisible() {
        if(this.backOnly && this.backAvailable) {
            return true;
        } else if (this.destination) {
            return true;
        }
        return false;
    }

}