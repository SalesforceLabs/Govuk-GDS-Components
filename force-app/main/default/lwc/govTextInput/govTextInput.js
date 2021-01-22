/**
 * Created by simon.cook on 18/09/2020.
 */

import {api, LightningElement, track, wire} from 'lwc';
import { MessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import REGISTER_MC from '@salesforce/messageChannel/registrationMessage__c';
import VALIDATION_MC from '@salesforce/messageChannel/validateMessage__c';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';

export default class GovTextInput extends LightningElement {
    @api fieldId;
    @api prefix = '';
    @api label = '';
    @api accessibilityText = '';
    @api suffix = '';
    @api fontSize;
    @api hintText = '';
    @api value = '';
    @api required = false;
    @api errorMessage = '';
    @api length;
    @api displayLength;
    @api regEx;
    @api isInset;
    @api maxCharacterCount = 255;
    @api showCharacterCount;

    @track charCount;

    hasErrors = false;
    regularExpression;
    initialised = false;

    // messaging attributes
    @wire(MessageContext) messageContext;
    validateSubscription;

    // Lifecycle functions

    connectedCallback() {

        // subscribe to validation messages
        this.subscribeMCs()

        // create the regex
        if(this.regEx) {
            this.regularExpression = new RegExp(this.regEx);
        }

        // set the char count based on value length
        this.charCount = (this.value) ? this.value.length : 0;

        // publish the registration message after 0.1 sec to give other components time to initialise
        setTimeout(() => {
            publish(this.messageContext, REGISTER_MC, {componentId:this.fieldId});
        }, 100);
    }

    disconnectedCallback() {
        this.unsubscribeMCs();
    }

    // Class related functions

    get inputClass() {
        //default to 20
        let theClass = 'govuk-input govuk-input--width-20';

        //check which variable to use - horrible hack due to error in using length as an input value in AppPage
        if(this.length) {
            theClass =  this.hasErrors ? `govuk-input govuk-input--width-${this.length} govuk-input--error` : `govuk-input govuk-input--width-${this.length}`;
        } else if(this.displayLength) {
            theClass =  this.hasErrors ? `govuk-input govuk-input--width-${this.displayLength} govuk-input--error` : `govuk-input govuk-input--width-${this.displayLength}`;
        }
        return theClass;
    }

    get groupClass() {
        let groupClass = "govuk-form-group";
        groupClass = (this.isInset) ? groupClass + " govuk-inset-text" : groupClass;
        groupClass = (this.hasErrors) ? groupClass + " govuk-form-group--error" : groupClass;
        return groupClass;
    }

    get labelClass() {
        let labelClass;

        switch(this.fontSize) {
            case "Small":
                labelClass = "govuk-label govuk-label--s";
                break;
            case "Medium":
                labelClass = "govuk-label govuk-label--m";
                break;
            case "Large":
                labelClass = "govuk-label govuk-label--l";
                break;
            default:
                labelClass = "govuk-label govuk-label--s";
        }
        return labelClass;
    }

    get characterCountText() {
        if(this.showCharacterCount) {
            if(this.charCount === 0 && this.maxCharacterCount) {
                return `You can enter up to ${this.maxCharacterCount} characters`;
            }
            let text = "";
            if(this.maxCharacterCount) {
                text = `${this.maxCharacterCount - this.charCount} characters remaining`;
            } else {
                text = `${this.charCount} characters`;
            }
            return text;
        }
    }

    // Event related functions

    handleKeyUp(event) {
        this.charCount = this.value.length;

        if(this.charCount <= this.maxCharacterCount) {
            this.value = event.target.value;
        }
        this.dispatchTextInputEvent()
    }

    dispatchTextInputEvent() {
        // tell the flow engine about the change
        const attributeChangeEvent = new FlowAttributeChangeEvent('value', this.value);
        this.dispatchEvent(attributeChangeEvent);

        // tell any parent components about the change
        const valueChangedEvent = new CustomEvent('valuechanged', {
            detail: {
                id: this.fieldId,
                value: this.value,
            }
        });
        this.dispatchEvent(valueChangedEvent);
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
        this.handleValidate();
    }

    @api handleValidate() {
        this.hasErrors = false;
        if (this.required && this.value === '') {
            this.hasErrors = true;
        } else {
            if (this.regularExpression && this.value !== '') {
                if (!this.regularExpression.test(this.value)) {
                    this.hasErrors = true;
                }
            }
        }

        console.log('TEXT_INPUT: Sending validation state message');
        publish(this.messageContext, VALIDATION_STATE_MC, {
            componentId: this.fieldId,
            isValid: !this.hasErrors,
            error: this.errorMessage
        });

        return !this.hasErrors;
    }

    @api clearError() {
        this.hasErrors = false;
    }
}