import {LightningElement, api, wire, track} from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import { MessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import REGISTER_MC from '@salesforce/messageChannel/registrationMessage__c';
import VALIDATION_MC from '@salesforce/messageChannel/validateMessage__c';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';

export default class GovCheckbox extends LightningElement {
    // flow inputs and outputs
    @api fieldId = "checkboxField";
    @api errorMessage;
    @api headinglabel;
    @api headinghint;
    @api required = false;
    @api labels ;
    @api names ;
    @api defaultValues ;
    @api outputValue = [];
    @api headingFontSize = '';
    @api smallerCheckboxes;

    @track checkboxArray = [];
    @track checked = false;

    // other attributes
    initialised;
    hasErrors;

    // messaging attributes
    @wire(MessageContext) messageContext;
    validateSubscription;

    //Lifecycle functions

    get headingLabelClass() {
        let headingLabelClass;
        switch(this.headingFontSize.toLowerCase()) {
            case "small":
                headingLabelClass = "govuk-label govuk-label--s";
                break;
            case "medium":
                headingLabelClass = "govuk-label govuk-label--m";
                break;
            case "large":
                headingLabelClass = "govuk-label govuk-label--l";
                break;
            default:
                headingLabelClass = "govuk-label govuk-label--s";
        }
        return headingLabelClass;
    }

    get checkboxClass() {
        let checkboxClass = "govuk-checkboxes";
        checkboxClass = (this.smallerCheckboxes) ? checkboxClass + " govuk-checkboxes--small" : checkboxClass;
        return checkboxClass;
    }

    connectedCallback() {
        // subscribe to the message channels
        this.subscribeMCs();

        // publish the registration message after 0.1 sec to give other components time to initialise
        setTimeout(() => {
            publish(this.messageContext, REGISTER_MC, {componentId:this.fieldId});
        }, 100);

        let labelsList = this.labels ? this.labels.split(';') : [];
        let namesList = this.names ? this.names.split(';') : [];
        let defaultValuesList = this.defaultValues ? this.defaultValues.split(';') : [];
        

        let checkboxObj = {
            checkboxLabel : '',
            checkboxName : '',
            checkboxValue : false
            };

        let defaultValuesBooleanList = [];

        for(let i=0; i<defaultValuesList.length;i++){
            if(defaultValuesList[i].toUpperCase() === 'TRUE') {
                defaultValuesBooleanList.push(true);
            }else{
                defaultValuesBooleanList.push(false);
            }
        }


        for(let i=0; i<labelsList.length;i++){
            checkboxObj.checkboxLabel = labelsList[i];
            checkboxObj.checkboxName = namesList[i];
            checkboxObj.checkboxValue = defaultValuesBooleanList[i];

            this.checkboxArray.push(checkboxObj);

            checkboxObj = {
                checkboxLabel : '',
                checkboxName : '',
                checkboxValue : false
            };
        }

        let checkedCount = 0;
        let outputString = '';

        for(var i=0; i<this.checkboxArray.length; i++){
            if(this.checkboxArray[i].checkboxValue == true){
                checkedCount ++;
                outputString = this.checkboxArray[i].checkboxName;
                this.outputValue.push(outputString);
                outputString = '';
            }
        }

        if(checkedCount>0){
            this.checked = true;
            this.dispatchCheckboxEvent();
            
        }else{
            this.checked = false;
        }

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
        
        this.outputValue = [];
        let outputString = '';

        let checkboxId = event.target.dataset.id;
        let checkedCount = 0;

        for(var i=0; i<this.checkboxArray.length; i++){
            if(this.checkboxArray[i].checkboxName == checkboxId){
                this.checkboxArray[i].checkboxValue = event.target.checked;
            }
            if(this.checkboxArray[i].checkboxValue == true){
                checkedCount ++;
                outputString = this.checkboxArray[i].checkboxName;
                this.outputValue.push(outputString);
                outputString = '';
            }
        }
        if(checkedCount>0){
            this.checked = true;
            
        }else{
            this.checked = false;
        }

        this.dispatchCheckboxEvent();
    }



    dispatchCheckboxEvent() {
        // tell the flow engine about the change
        const attributeChangeEvent = new FlowAttributeChangeEvent('value', this.outputValue);
        this.dispatchEvent(attributeChangeEvent);

        // tell any parent components about the change
        const valueChangedEvent = new CustomEvent('valuechanged', {
            detail: {
                id: this.fieldId,
                value: this.outputValue,
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