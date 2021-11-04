/**
 * Component Name: Gov UK Checkbox
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Harshpreet Singh Chhabra/Brenda Campbell
 **/
import {LightningElement, api, wire, track} from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import { MessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import REGISTER_MC from '@salesforce/messageChannel/registrationMessage__c';
import VALIDATION_MC from '@salesforce/messageChannel/validateMessage__c';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';
import getPicklistValuesByObjectField from '@salesforce/apex/GovComponentHelper.getPicklistValuesByObjectField';

export default class GovCheckboxes extends LightningElement {
    // flow inputs and outputs
    @api fieldId = "checkboxField";
    @api errorMessage;
    @api headinglabel;
    @api headinghint;
    @api required = false;
    @api labels ;
    //@api names ;
    @api booleanValues;
    @api outputValueCollection = [];
    @api outputValueBoolean;
    @api outputValue;
    @api picklistField;

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
        let defaultValuesBooleanList = [];
        let defaultValuesList = this.outputValueBoolean ? this.outputValueBoolean.split(';') : [];
        for(let i=0; i<defaultValuesList.length;i++){
            if(defaultValuesList[i].toUpperCase() === 'TRUE') {
                defaultValuesBooleanList.push(true);
            }else{
                defaultValuesBooleanList.push(false);
            }
        }
        if(this.picklistField !== '' && this.picklistField !== undefined && this.picklistField !== null) {
            // get picklist field values
            getPicklistValuesByObjectField({
                strSObjectFieldName: this.picklistField
            })
                .then(result => {
                    //this.checkboxArray = [];
                    for(let i=0; i<result.length; i++) {
                        let checkboxObj = {
                            checkboxLabel : '',
                            checkboxValue : false
                            };   
                        checkboxObj.checkboxLabel = result[i];
                        if (i<defaultValuesBooleanList.length) {
                            checkboxObj.checkboxValue = defaultValuesBooleanList[i];
                        } else {
                            checkboxObj.checkboxValue = false;
                        }
                        this.checkboxArray.push(checkboxObj);     
                    }
                })
                .catch(error => {
                    console.error(`Select:connectedCallback - could not get checkbox picklist values due to ${error.message}`);
                })
        } else {
            //user provided values
            let labelsList = this.labels ? this.labels.split(',') : [];
            for(let i=0; i<labelsList.length;i++){
                let checkboxObj = {
                    checkboxLabel : '',
                    checkboxValue : false
                    };
                checkboxObj.checkboxLabel = labelsList[i];
                if (i<defaultValuesBooleanList.length) {
                    checkboxObj.checkboxValue = defaultValuesBooleanList[i];
                } else {
                    checkboxObj.checkboxValue = false;
                }
                this.checkboxArray.push(checkboxObj);
            }
        }

        let checkedCount = 0;
        let outputString = '';

        for(var i=0; i<this.checkboxArray.length; i++){
            if (i==0) {
                this.outputValueBoolean = this.checkboxArray[i].checkboxValue;
            } else {
                this.outputValueBoolean = this.outputValueBoolean + ';' + this.checkboxArray[i].checkboxValue;
            }
            if(this.checkboxArray[i].checkboxValue == true){
                checkedCount ++;
                outputString = this.checkboxArray[i].checkboxLabel;
                this.outputValueCollection.push(outputString);
                if (this.outputValue === undefined) {
                    this.outputValue = outputString;
                } else {
                    this.outputValue = this.outputValue + ';' + outputString;
                }
                outputString = '';
            }
        }

        if(checkedCount>0){
            this.checked = true;
            this.dispatchCheckboxEvent();
            
        }else{
            this.checked = false;
        }

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
        
        this.outputValueCollection = [];
        this.outputValueBoolean = '';
        this.outputValue = '';
        let outputString = '';
        let checkboxId = event.target.dataset.id;
        let checkedCount = 0;

        for(var i=0; i<this.checkboxArray.length; i++){
            if(this.checkboxArray[i].checkboxLabel == checkboxId){
                this.checkboxArray[i].checkboxValue = event.target.checked;
            }
            if (i==0) {
                this.outputValueBoolean = this.checkboxArray[i].checkboxValue;
            } else {
                this.outputValueBoolean = this.outputValueBoolean + ';' + this.checkboxArray[i].checkboxValue;
            }
            if(this.checkboxArray[i].checkboxValue == true){
                checkedCount ++;
                outputString = this.checkboxArray[i].checkboxLabel;
                this.outputValueCollection.push(outputString);
                if (this.outputValue.length==0) {
                    this.outputValue = outputString;
                } else {
                    this.outputValue = this.outputValue + ';' + outputString;
                }
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
        return this.hasErrors ? "govuk-input--error" : "govuk-input";
    }

    get groupClass() {
        let groupClass = "govuk-form-group";
        groupClass = (this.hasErrors) ? groupClass + " govuk-form-group--error" : groupClass;
        return groupClass;
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

        //console.log('CHECKBOX: Sending validation state message');
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