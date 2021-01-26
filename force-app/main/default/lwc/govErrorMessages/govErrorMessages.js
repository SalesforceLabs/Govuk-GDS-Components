import {LightningElement, track,wire} from 'lwc';
import { MessageContext, subscribe, unsubscribe } from 'lightning/messageService';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';
import VALIDATE_MC from '@salesforce/messageChannel/validateMessage__c';

export default class ErrorMessages extends LightningElement {
    @track components = [];

    // messaging attributes
    @wire(MessageContext) messageContext;
    errorSubscription;

    connectedCallback() {
        this.subscribeMCs()
    }

    disconnectedCallback() {
        this.unsubscribeMCs();
    }

    get hasErrors() {
        return (this.components.filter(component => component.isValid === false).length > 0);
    }

    subscribeMCs() {
        if (this.errorSubscription) {
            return;
        }
        this.errorSubscription = subscribe(
            this.messageContext,
            VALIDATION_STATE_MC, (message) => {
                this.handleValidationStateMessage(message);
            });
        if (this.validateSubscription) {
            return;
        }
        this.validateSubscription = subscribe (
            this.messageContext,
            VALIDATE_MC, (message) => {
                this.handleValidateMessage(message);
            });
    }

    unsubscribeMCs() {
        unsubscribe(this.errorSubscription);
        this.errorSubscription = null;
    }

    // called during validation to update error states and messages
    handleValidationStateMessage(message) {
        console.log(`ERROR_MESSAGES: received validation message from component ${JSON.stringify(message)}`);
        const component = this.components.find(component => component.id === message.componentId);
        if(component) {
            if(message.isValid === true) {
                this.components = this.components.filter(component => component.id !== message.componentId);
            } else {
                component.isValid = message.isValid;
                component.error = message.error;
            }
        } else {
            if(message.isValid === false) {
                const component = {};
                component.id = message.componentId;
                component.isValid = message.isValid;
                component.error = message.error;
                this.components.push(component);
            }
        }
        console.log(`ERROR_MESSAGES: components are ${JSON.stringify(this.components)}`);
    }

    // called at the start of validation to remove existing errors
    handleValidateMessage(message) {
        this.components = [];
    }
}