/**
 * Component Name: Gov UK Text Input
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Neetesh Jain/Brenda Campbell
 **/
import { LightningElement, api, track, wire } from 'lwc';
import { MessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import REGISTER_MC from '@salesforce/messageChannel/registrationMessage__c';
import VALIDATION_MC from '@salesforce/messageChannel/validateMessage__c';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';

export default class GovTextInput extends LightningElement {
    
    @api fieldId = 'textField';
    @api label = '';
    @api labelFontSize = 'Medium';
    @api widthLengthWise = '20';
    @api widthQuarterWise = '';
    @api hintText = '';
    @api regexPattern = '';
    @api prefix = '';
    @api suffix = '';
    @api autocompleteType = '';
    @api spellcheckRequired = false;
    @api errorMessage = '';
    @api required = false;
    @api value = '';
    @api maxCharacterCount = 255;
    @api showCharacterCount = false;

    @track charCount;
    @track hasErrors = false;
    @track regularExpression;
    
    initialised = false;

    // LMS attributes
    @wire(MessageContext) messageContext;
    validateSubscription;

    // Lifecycle functions
    connectedCallback() { 
        // subscribe to validation messages
        this.subscribeMCs();

        // create the regex
        if(this.regexPattern) {
            this.regularExpression = new RegExp(this.regexPattern);
        }
        // set the char count based on value length
        this.charCount = (this.value) ? this.value.length : 0;

        // publish the registration message after 0.1 sec to give other components time to initialise
        setTimeout(() => {
            publish(this.messageContext, REGISTER_MC, { componentId: this.fieldId });
        }, 100);
    }

    disconnectedCallback() {
        this.unsubscribeMCs();
    }

    get groupClass() {
        let groupClass = "govuk-form-group";
        groupClass = (this.hasErrors) ? groupClass + " govuk-form-group--error" : groupClass;
        return groupClass;
    }

    get labelClass() {
        let labelClass;
        if(this.labelFontSize) {
            switch(this.labelFontSize.toLowerCase()) {
                case "small":
                    labelClass = "govuk-label govuk-label--s";
                    break;
                case "medium":
                    labelClass = "govuk-label govuk-label--m";
                    break;
                case "large":
                    labelClass = "govuk-label govuk-label--l";
                    break;
                default:
                    labelClass = "govuk-label govuk-label--s";
            }
        } else {
            labelClass = "govuk-label govuk-label--s";
        }
        return labelClass;
    }

    get inputClass() {
        let inputClass = 'govuk-input govuk-input--width-20';   // Fixed width input characters length 20

        //check which variable to use - horrible hack due to error in using length as an input value in AppPage
        if(this.widthLengthWise) {
            inputClass =  this.hasErrors ? `govuk-input govuk-input--width-${this.widthLengthWise} govuk-input--error` : `govuk-input govuk-input--width-${this.widthLengthWise}`;
        } else if(this.widthQuarterWise) {
            inputClass =  this.hasErrors ? `govuk-input govuk-input--width-${this.widthQuarterWise} govuk-input--error` : `govuk-input govuk-input--width-${this.widthQuarterWise}`;
        }
        return inputClass;
    }

    get characterCountText() {
        if(this.showCharacterCount) {
            if(this.charCount === 0 && this.maxCharacterCount) {
                return `${this.maxCharacterCount - this.charCount} characters remaining`;
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
        this.value = event.target.value;
        this.charCount = this.value.length;
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

    @api 
    handleValidate() {
        this.hasErrors = false;
        if (this.required && this.value === '') {
            this.hasErrors = true;
        } else {
            if (this.regularExpression !== undefined && this.regularExpression !== '' && this.value !== '') {
                if (!this.regularExpression.test(this.value)) {
                    this.hasErrors = true;
                }
            }
        }
        publish(this.messageContext, VALIDATION_STATE_MC, {
            componentId: this.fieldId,
            isValid: !this.hasErrors,
            error: this.errorMessage
        });

        return !this.hasErrors;
    }

    @api 
    clearError() {
        this.hasErrors = false;
    }

}