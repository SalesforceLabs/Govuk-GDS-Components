/**
 * Created by simon.cook on 30/09/2020.
 */

import {LightningElement, api, track, wire} from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import getPicklistValuesByObjectField from '@salesforce/apex/govComponentHelper.getPicklistValuesByObjectField';
import { MessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import REGISTER_MC from '@salesforce/messageChannel/registrationMessage__c';
import VALIDATION_MC from '@salesforce/messageChannel/validateMessage__c';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';

export default class GovRadios extends LightningElement {
    @api fieldId;
    @api label;
    
    @api fontSize;
    @api hint;
    @api picklist;
    @api radioValues = "";
    @api radioLabels = "";
    @api value = "";
    @api required;
    @api errorMessage;

    @track radioOptions = [];
    @track isStacked = false;
    @track isInitialised = false;
    @track hasErrors = false;

    // messaging attributes
    @wire(MessageContext) messageContext;
    validateSubscription;

    connectedCallback() {
        if(this.picklist !== '' && this.picklist !== undefined && this.picklist !== null) {
            //picklist values
            getPicklistValuesByObjectField({field:this.picklist})
                .then(result => {
                    this.radioOptions = [];
                    for(let i=0; i<result.length; i++) {
                        let radioOption = {};
                        radioOption.key = `picklist-value-${i}`;
                        radioOption.value = result[i];
                        radioOption.label = result[i];
                        radioOption.checked = (this.value === result[i]);
                        this.radioOptions.push(radioOption);
                    }
                    this.isStacked = (this.radioOptions.length > 2) ? true : false;
                    this.isInitialised = true;
                })
                .catch(error => {
                    console.error(`Select:connectedCallback - could not get picklist values due to ${error.message}`);
                })
        } else {
            //csv values
            const radioLabelsArray = this.radioLabels.split(',');
            const radioValuesArray = this.radioValues.split(',');
            this.radioOptions = [];
            for(let i=0; i<radioLabelsArray.length;i++) {
                let radioOption = {};
                radioOption.key = `csv-value-${i}`;
                radioOption.label = radioLabelsArray[i];
                radioOption.value = radioValuesArray[i];
                radioOption.checked = (this.value === radioValuesArray[i]);
                this.radioOptions.push(radioOption);
            }
            this.isStacked = (this.radioOptions.length > 2) ? true : false;
            this.isInitialised = true;
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

    get groupClass() {
        let groupClass = "govuk-form-group";
        // groupClass = (this.isInset) ? groupClass + " govuk-inset-text" : groupClass;
        groupClass = (this.hasErrors) ? groupClass + " govuk-form-group--error" : groupClass;
        return groupClass;
    }

    get labelClass() {
        var labelClass;

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

    handleValueChanged(event) {
        this.value = event.target.value;

        this.radioOptions.forEach(radioOption => {
           if(radioOption.value === this.value) {
               radioOption.checked = true;
           } else {
               radioOption.checked = false;
           }
        });

        console.log(`RADIOS: value is ${this.value}`);
        this.dispatchRadioEvent();
    }

    dispatchRadioEvent() {
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

    @api setValue(newValue) {
        this.value = newValue;
        this.radioOptions.forEach( option => {
            if(option.value === newValue) {
                option.checked = true;
            } else {
                option.checked = false;
            }
        })
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

        if(this.required && (this.value === '' || this.value === undefined)) {
            this.hasErrors = true;
        }

        console.log('RADIO: Sending validation state message');
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