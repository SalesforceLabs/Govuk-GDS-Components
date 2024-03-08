/**
 * Component Name: Gov UK Text Input
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Neetesh Jain/Brenda Campbell, Jakub Szelagowski
  * 
 **/
import { LightningElement, api, track, wire } from 'lwc';
import { MessageContext, publish, subscribe, unsubscribe, createMessageContext } from 'lightning/messageService';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import REGISTER_MC from '@salesforce/messageChannel/registrationMessage__c';
import UNREGISTER_MC from '@salesforce/messageChannel/unregistrationMessage__c';
import VALIDATION_MC from '@salesforce/messageChannel/validateMessage__c';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';
import SET_FOCUS_MC from '@salesforce/messageChannel/setFocusMessage__c';

export default class GovTextInput extends LightningElement {
    static delegatesFocus = true;
    // static renderMode = 'light';
    @api fieldId = 'textField';
    @api textFieldId = "input-text";
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
    
    @api h1Size = false;
    @api h2Size = false;
    @api h3Size = false;

    initialised = false;

    // LMS attributes
    @wire(MessageContext) messageContext;
    validateSubscription;
    setFocusSubscription;


    // Lifecycle functions
    connectedCallback() {
        // console.log('govTextInput.js connectedCallback');

        // sets the H value for template based on labele font size  
        this.getHSize(); 
        
        // subscribe to validation messages
        this.subscribeMCs();

        // create the regex
        if(this.regexPattern) {
            this.regularExpression = new RegExp(this.regexPattern);
        }
        // set the char count based on value length
        this.charCount = (this.value) ? this.value.length : 0;

        this.register();
    }

    renderedCallback() {

        // console.log('govTextInput.js renderedCallback');
        // getting ID of component's field
        this.textFieldId = this.template.querySelector('input').getAttribute('id'); 
        
        // inserting hint text and rendering its HTML
        const htmlElement = this.template.querySelector(".html-element");
        if(htmlElement) {
            htmlElement.innerHTML = this.hintText;
            this.initialised = true;
        }
    }

    disconnectedCallback() {
        this.unregister();
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
    
    getHSize(){
        if(this.labelFontSize) {
            switch(this.labelFontSize.toLowerCase()) {
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
        // Report Errors up to govErrorMessages Component
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

    //inform subscribers to add this comoponent to the list of component for validation
    register() {
        // publish the registration message after 0.1 sec to give other components time to initialise
        setTimeout(() => {
            publish(this.messageContext, REGISTER_MC, { componentId: this.textFieldId });
        }, 100);
    }

    //inform subscribers that this comoponent is no longer available
    unregister() {
        console.log('govTextInput: unregister',this.textFieldId);

        //have to create a new message context to unregister
        publish(createMessageContext(), UNREGISTER_MC, { componentId: this.textFieldId });
    }

    handleSetFocusMessage(message){
        // filter message to check if our component (id) needs to set focus
        let myComponentId = message.componentId;

        if(myComponentId == this.textFieldId){
            let myComponent = this.template.querySelector('input');
            myComponent.focus();
        }
    }

    handleValidateMessage(message) {
        this.handleValidate();
    }

    @api 
    handleValidate() {
        console.log('INSIDE: [govTextInput.js: handleValidate]');
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
            componentId: this.textFieldId,
            componentSelect: 'INPUT',
            isValid: !this.hasErrors,
            error: this.errorMessage,
            focusId: this.textFieldId
        });

        return !this.hasErrors;
    }

    @api 
    clearError() {
        this.hasErrors = false;
    }

}