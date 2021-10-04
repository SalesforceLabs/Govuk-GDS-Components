/**
 * Component Name: Gov UK Date Input
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Neetesh Jain/Brenda Campbell
 **/
import { LightningElement, api, track, wire } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import { MessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import REGISTER_MC from '@salesforce/messageChannel/registrationMessage__c';
import VALIDATE_MC from '@salesforce/messageChannel/validateMessage__c';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';

export default class GovDate extends LightningElement {
    
    @api fieldId = "dateField";
    @api label = "";
    @api fontSize = "";
    @api hintText = "";
    @api required = false;
    @api value = "";
    @api formattedDate = "";

    @track dayValue = "";
    @track monthValue = "";
    @track yearValue = "";
    @track hasErrors = false;
    @track hasDayError = false;
    @track hasMonthError = false;
    @track hasYearError = false;
    @track errorMessages = [];

    months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    // messaging attributes
    @wire(MessageContext) messageContext;
    validateSubscription;

    get groupClass() {
        if (this.hasErrors) {
            return "govuk-form-group govuk-form-group--error";
        }
        return "govuk-form-group";
    }
    
    get labelClass() {
        let labelClass;

        switch (this.fontSize) {
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

    get dayClass() {
        return (this.hasDayError) ? "govuk-input govuk-date-input__input govuk-input--width-2 day-field govuk-input--error" : "govuk-input govuk-date-input__input govuk-input--width-2 day-field";
    }

    get monthClass() {
        return (this.hasMonthError) ? "govuk-input govuk-date-input__input govuk-input--width-2 month-field govuk-input--error" : "govuk-input govuk-date-input__input govuk-input--width-2 month-field";
    }

    get yearClass() {
        return (this.hasYearError) ? "govuk-input govuk-date-input__input govuk-input--width-4 year-field govuk-input--error" : "govuk-input govuk-date-input__input govuk-input--width-4 year-field";
    }

    connectedCallback() {
        if (this.value) {
            let parts = this.value.split("/");
            if (parts.length === 3) {
                this.dayValue = parts[0];
                this.monthValue = parts[1];
                this.yearValue = parts[2];
                this.formattedDate = this.yearValue + "-" + this.monthValue + "-" + this.dayValue;
            }
        }

        // subscribe to the message channels
        this.subscribeMCs();

        // publish the registration message after 0.1 sec to give other components time to initialise
        setTimeout(() => {
            publish(this.messageContext, REGISTER_MC, {componentId: this.fieldId+" day"});
            publish(this.messageContext, REGISTER_MC, {componentId: this.fieldId+" month"});
            publish(this.messageContext, REGISTER_MC, {componentId: this.fieldId+" year"});
        }, 100);
    }

    disconnectedCallback() {
        this.unsubscribeMCs();
    }

    handleDayChange(event) {
        this.dayValue = event.target.value;
        this.updateValue();
    }

    handleMonthChange(event) {
        this.monthValue = event.target.value;
        this.updateValue();
    }

    handleYearChange(event) {
        this.yearValue = event.target.value;
        this.updateValue();
    }

    updateValue() {
        this.value = this.dayValue + "/" + this.monthValue + "/" + this.yearValue;
        this.formattedDate = this.yearValue + "-" + this.monthValue + "-" + this.dayValue;
        this.dispatchValueChangedEvent();
    }

    dispatchValueChangedEvent() {
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

    isValidDate(d, m, y) {
        return (m >= 0 && m < 12 && d > 0 && d <= this.daysInMonth(m, y));
    }

    daysInMonth(m, y) {
        switch (m) {
            case 1 :
                return (y % 4 == 0 && y % 100) || y % 400 == 0 ? 29 : 28;
            case 8 :
            case 3 :
            case 5 :
            case 10 :
                return 30;
            default :
                return 31
        }
    }

    // LMS functions
    subscribeMCs() {
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
        unsubscribe(this.validateSubscription);
        this.validateSubscription = null;
    }

    handleValidateMessage(message) {
        this.handleValidate();
    }

    @api 
    handleValidate(message) {
        // clear current page errors
        this.errorMessages = [];
        this.hasErrors = false;
        this.hasDayError = false;
        this.hasMonthError = false;
        this.hasYearError = false;

        let day = parseInt(this.dayValue, 10);
        let month = parseInt(this.monthValue, 10);
        let year = parseInt(this.yearValue, 10);

        if(this.required || (!isNaN(day) || !isNaN(month) || !isNaN(year))) {
            // do we have valid numbers for day, month & year
            if (isNaN(day)) {
                this.hasDayError = true;
            }   
            if (isNaN(month)) {
                this.hasMonthError = true;
            } else {
                month = month - 1;
                if (month < 0 || month > 11) {
                    this.hasMonthError = true;
                }
            }
            if (isNaN(year)) {
                this.hasYearError = true;
            }
            this.hasErrors = (this.hasDayError || this.hasMonthError || this.hasYearError);
            if (!this.hasErrors) {
                if (!this.isValidDate(day, month, year)) {
                    this.hasDayError = true;
                }
                this.hasErrors = (this.hasDayError || this.hasMonthError);
            }  
        }

        // Create errors and events for error notifications
        if(this.hasDayError) {
            this.errorMessages.push({
                key: 1,
                target: "dayField",
                detail: "Please enter a valid number for the day"
            });
            publish(this.messageContext, VALIDATION_STATE_MC, {
                componentId: this.fieldId + " day",
                isValid: false,
                error: "Please enter a valid number for the day"
            });
        } else {
            publish(this.messageContext, VALIDATION_STATE_MC, {
                componentId: this.fieldId + " day",
                isValid: true,
                error: ""
            });
        }

        if(this.hasMonthError) {
            this.errorMessages.push({
                key: 1,
                target: "monthField",
                detail: "Please enter a valid number for the month"
            });
            publish(this.messageContext, VALIDATION_STATE_MC, {
                componentId: this.fieldId + " month",
                isValid: false,
                error: "Please enter a valid number for the month"
            });
        } else {
            publish(this.messageContext, VALIDATION_STATE_MC, {
                componentId: this.fieldId + " month",
                isValid: true,
                error: ""
            });
        }

        if(this.hasYearError) {
            this.errorMessages.push({
                key: 1,
                target: "yearField",
                detail: "Please enter a valid number for the year"
            });
            publish(this.messageContext, VALIDATION_STATE_MC, {
                componentId: this.fieldId + " year",
                isValid: false,
                error: "Please enter a valid number for the year"
            });
        } else {
            publish(this.messageContext, VALIDATION_STATE_MC, {
                componentId: this.fieldId + " year",
                isValid: true,
                error: ""
            });
        }
    }

    @api 
    clearError() {
        this.hasErrors = false;
    }
    
}