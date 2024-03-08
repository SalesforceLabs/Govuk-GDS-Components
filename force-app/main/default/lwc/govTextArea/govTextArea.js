/**
 * Component Name: Gov UK Warning Text
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Harshpreet Singh Chhabra/Brenda Campbell, Jakub Szelagowski
 **/
import {LightningElement, api, track, wire} from 'lwc';
import {FlowAttributeChangeEvent} from 'lightning/flowSupport';
import { MessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import REGISTER_MC from '@salesforce/messageChannel/registrationMessage__c';
import UNREGISTER_MC from '@salesforce/messageChannel/unregistrationMessage__c';
import VALIDATION_MC from '@salesforce/messageChannel/validateMessage__c';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';
import SET_FOCUS_MC from '@salesforce/messageChannel/setFocusMessage__c';

export default class GovTextArea extends LightningElement {
    @api fieldId = "textAreaField";
    @api textAreaFieldId = "text-area";
    @api label;
    @api hint;
    @api value = '';
    @api characterLimit;
    @api required;
    @api errorMessage;
    @api fontSize = 'Medium';
    @api labelFontSize; // OBSOLETE - can't remove form package 
    @api maxCharacterCount = 32768;
    @api showCharacterCount;
    @api rowCount = 5;

    @track displayCharacterLimit;
    @track hasErrors;
    @track charCount;

    @api h1Size = false;
    @api h2Size = false;
    @api h3Size = false;

    // messaging attributes
    @wire(MessageContext) messageContext;
    validateSubscription;
    setFocusSubscription;

    connectedCallback() {
        // sets the H value for template based on labele font size  
        this.getHSize(); 

        // set the value to blank if it's undefined
        this.value = (this.value === undefined) ? '' : this.value;

        // set the char count based on value length
        this.charCount = (this.value) ? this.value.length : 0;

        // subscribe to the message channels
        this.subscribeMCs();

        this.register();
    }

    renderedCallback() {
        // getting ID of component's field
        this.textAreaFieldId = this.template.querySelector('textarea').getAttribute('id'); 
    }

    disconnectedCallback() {
        this.unregister();
        this.unsubscribeMCs();
    }

    get inputClass() {
        return this.hasErrors ? `govuk-textarea govuk-js-character-count govuk-textarea--error` : `govuk-textarea govuk-js-character-count`;
    }

    get groupClass() {
        let groupClass = "govuk-form-group";
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
                return `${this.maxCharacterCount - this.charCount} characters remaining`;
            }
            let text = "";
            if(this.maxCharacterCount) {
                text =  `${this.maxCharacterCount - this.charCount} characters remaining`;
            } else {
                text = `${this.charCount} characters`;
            }
            return text;
        }
    }

    getHSize(){
        if(this.fontSize) {
            switch(this.fontSize.toLowerCase()) {
                case "small":
                    this.h3Size = true;
                    // labelClass = "govuk-label govuk-label--s";
                    break;
                case "medium":
                    this.h2Size = true;
                    // labelClass = "govuk-label govuk-label--m";
                    break;
                case "large":
                    this.h1Size = true;
                    // labelClass = "govuk-label govuk-label--l";
                    break;
                default:
                    this.h3Size = true;
                    // labelClass = "govuk-label govuk-label--s";
            }
        } else {
            this.h3Size = true;
            // labelClass = "govuk-label govuk-label--s";
        }
        //return labelClass;
    }

    handleKeyUp(event) {
        
        if(this.charCount <= this.maxCharacterCount) {
            this.value = event.target.value;
        }
        this.charCount = this.value.length;
        this.dispatchTextAreaEvent()
    }

    dispatchTextAreaEvent() {
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

        // Receive focus request with message.componentId
        this.setFocusSubscription = subscribe (
            this.messageContext,
            SET_FOCUS_MC, (message) => {
                this.handleSetFocusMessage(message);
            }
        )
    }

    unsubscribeMCs() {
        unsubscribe(this.validateSubscription);
        this.validateSubscription = null;
        unsubscribe(this.setFocusSubscription);
        this.setFocusSubscription = null;
    }

    register(){
        // publish the registration message after 0.1 sec to give other components time to initialise
        setTimeout(() => {
            publish(this.messageContext, REGISTER_MC, {componentId:this.fieldId});
        }, 100);
    }

    //inform subscribers that this comoponent is no longer available
    unregister() {
        console.log('govTextArea: unregister',this.fieldId);

        //have to create a new message context to unregister
        publish(createMessageContext(), UNREGISTER_MC, { componentId: this.fieldId });
    }

    handleSetFocusMessage(message){
        // filter message to check if our component (id) needs to set focus
        let myComponentId = message.componentId;
        if(myComponentId == this.textAreaFieldId){
            let myComponent = this.template.querySelector('textarea');
            myComponent.focus();
        }
    }

    handleValidateMessage(message) {
        this.handleValidate()
    }

    @api handleValidate() {
        this.hasErrors = false;

        if(this.required && this.value === "") {
            this.hasErrors = true;
        } else {
            this.hasErrors = false;
        }

        publish(this.messageContext, VALIDATION_STATE_MC, {
            componentId: this.fieldId,
            isValid: !this.hasErrors,
            error: this.errorMessage,
            focusId: this.textAreaFieldId
        });
    }

    @api clearError() {
        this.hasErrors = false;
    }
}