/**
 * Created by simon.cook on 23/09/2020.
 */

import {LightningElement, api, wire} from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import { MessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import REGISTER_MC from '@salesforce/messageChannel/registrationMessage__c';
import VALIDATION_MC from '@salesforce/messageChannel/validateMessage__c';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';

export default class GovCheckbox extends LightningElement {
    // flow inputs and outputs
    @api fieldId;
    @api errorMessage;
    @api label;
    @api checked = false;
    @api required = false;

    // other attributes
    initialised;
    hasErrors;

    // messaging attributes
    @wire(MessageContext) messageContext;
    validateSubscription;

    //Lifecycle functions

    connectedCallback() {
        // subscribe to the message channels
        this.subscribeMCs();

        // publish the registration message after 0.1 sec to give other components time to initialise
        setTimeout(() => {
            publish(this.messageContext, REGISTER_MC, {componentId:this.fieldId});
        }, 100);
    }

    disconnectedCallback() {
        this.unsubscribeMCs();
    }

    renderedCallback() {
        if(this.initialised) {
            return;
        }
        const labelText = this.template.querySelectorAll(".label-text").forEach(element => {
            element.innerHTML = this.label;
        })
        this.initialised = true;
    }

    // Event Functions

    handleClick(event) {
        this.checked = event.target.checked;
        this.dispatchCheckboxEvent();
    }

    dispatchCheckboxEvent() {
        // tell the flow engine about the change
        const attributeChangeEvent = new FlowAttributeChangeEvent('value', this.checked);
        this.dispatchEvent(attributeChangeEvent);

        // tell any parent components about the change
        const valueChangedEvent = new CustomEvent('valuechanged', {
            detail: {
                id: this.fieldId,
                value: this.checked,
            }
        });
        this.dispatchEvent(valueChangedEvent);
    }

    // Class functions

    get inputClass() {
        return this.hasErrors ? `govuk-input--error` : `govuk-input`;
    }

    get groupClass() {
        return this.hasErrors ? "govuk-form-group govuk-form-group--error" : "govuk-form-group";
    }


    // LMS functions

    subscribeMCs() {
        if (this.validateSubscription) {
            return;
        }
        this.validateSubscription = subscribe (
            this.messageContext,
            VALIDATION_MC, (message) => {
                this.handleValidateMessage(message);
            });
    }

    unsubscribeMCs() {
        unsubscribe(this.validateSubscription);
        this.validateSubscription = null;
    }

    handleValidateMessage(message) {
        this.handleValidation()
    }

    @api handleValidation() {
        this.hasErrors = false;

        if(this.required && !this.checked) {
            this.hasErrors = true;
        } else {
            this.hasErrors = false;
        }

        console.log('CHECKBOX: Sending validation state message');
        publish(this.messageContext, VALIDATION_STATE_MC, {
            componentId: this.fieldId,
            isValid: !this.hasErrors,
            error: this.errorMessage
        });
    }

    @api clearError() {
        this.hasErrors = false;
    }
}