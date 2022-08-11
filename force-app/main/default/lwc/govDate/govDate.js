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
 import Day_Label from '@salesforce/label/c.uxg_Day_label';
 import Month_label from '@salesforce/label/c.uxg_Month_label';
 import Year_label from '@salesforce/label/c.uxg_Year_label';
 import Invalid_day_error from '@salesforce/label/c.uxg_Invalid_day_error';
 import Invalid_month_error from '@salesforce/label/c.uxg_Invalid_month_error'; 
 import Invalid_year_error from '@salesforce/label/c.uxg_Invalid_year_error';
 import Non_numeric_day_error from '@salesforce/label/c.uxg_Non_numeric_day_error';
 import Non_numeric_month_error from '@salesforce/label/c.uxg_Non_numeric_month_error';
 import Non_numeric_year_error from '@salesforce/label/c.uxg_Non_numeric_year_error';
 export default class GovDate extends LightningElement {
     
 
    dayLabel = Day_Label;
    monthLabel = Month_label;
    yearLabel = Year_label;
    componentTypeName = "UXGOVUK-GOV-DATE";
    componentSelectorName = "INPUT";

    @api fieldId = "dateField";
    @api dayFieldId = "date-input-day";
    @api monthFieldId = "date-input-month";
    @api yearFieldId = "date-input-year";
    @api label = "";
    @api fontSize = "";
    @api hintText = "";
    @api required = false;
    @api value = "";
    @api formattedDate = "";
    @api minDate = "";
    @api maxDate = "";

    @track dayValue = "";
    @track monthValue = "";
    @track yearValue = "";
    @track hasErrors = false;
    @track hasDayError = false;
    @track hasMonthError = false;
    @track hasYearError = false;
    @track dayErrorMsg = "";
    @track monthErrorMsg = "";
    @track yearErrorMsg = "";
    @track day = "";
    @track month = "";
    @track year = "";
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
             publish(this.messageContext, REGISTER_MC, {componentId: this.fieldId});
         }, 100);
     }

     renderedCallback() {
        if ((this.template.querySelector('input').getAttribute('id')).indexOf(this.dayFieldId) !== -1) {
            this.dayFieldId = this.template.querySelector('input').getAttribute('id');
        }
        if ((this.template.querySelector('input').getAttribute('id')).indexOf(this.monthFieldId) !== -1) {
            this.monthFieldId = this.template.querySelector('input').getAttribute('id');
        }
        if ((this.template.querySelector('input').getAttribute('id')).indexOf(this.yearFieldId) !== -1) {
            this.yearFieldId = this.template.querySelector('input').getAttribute('id');
        }
    }

     disconnectedCallback() {
         this.unsubscribeMCs();
     }
     handleDayChange(event) {
         this.dayValue = event.target.value;
         this.dayFieldId = event.target.id;
         this.updateValue();
     }
     handleMonthChange(event) {
         this.monthValue = event.target.value;
         this.monthFieldId = event.target.id;
         this.updateValue();
     }
     handleYearChange(event) {
         this.yearValue = event.target.value;
         this.yearFieldId = event.target.id;
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
         return (m > 0 && m < 13 && d > 0 && d <= this.daysInMonth(m, y));
     }
 
     daysInMonth(m, y) {
         switch (m) {
             case 2 :
                 return (y % 4 == 0 && y % 100) || y % 400 == 0 ? 29 : 28;
             case 9 :
             case 4 :
             case 6 :
             case 11 :
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
         this.dayErrorMsg = "";
         this.monthErrorMsg = "";
         this.yearErrorMsg = "";
         this.day = '';
         this.month = '';
         this.year = '';

        if (!this.required && this.dayValue.length == 0 && this.monthValue.length == 0 && this.yearValue.length == 0) {
            // Not required and everything is empty then skip all validation
            this.showNotifications();
        } else {
            // May be required or at least 1 field has some value so need to validate
            this.checkValidNumbersUsed();
            if(!this.hasDayError && !this.hasMonthError && !this.hasYearError) {
                // do we have valid numbers for day, month & year
                if (isNaN(this.day)) {
                    this.dayErrorMsg = Invalid_day_error;
                    this.hasDayError = true;
                }                   
                if (isNaN(this.month)) {
                    this.monthErrorMsg = Invalid_month_error;
                    this.hasMonthError = true;
                } else {
                    if (this.month < 0 || this.month > 12) {
                        this.monthErrorMsg = Invalid_month_error;
                        this.hasMonthError = true;
                    } else {
                        this.checkForValidDaysInMonth();
                    }
                }
                if (isNaN(this.year)) {
                    this.yearErrorMsg = Invalid_year_error;
                    this.hasYearError = true;
                } else {
                    if (this.year < 1700 || this.year > 2200) {
                        this.yearErrorMsg = Invalid_year_error;
                        this.hasYearError = true;
                    } else {
                        if (this.month == 2) {
                            if(this.year % 4 !== 0) {
                                if (this.day < 0 || this.day > 28) {
                                    this.dayErrorMsg = Invalid_day_error;
                                    this.hasDayError = true;
                                } 
                            } else {
                                if (this.day < 0 || this.day > 29) {
                                    this.dayErrorMsg = Invalid_day_error;
                                    this.hasDayError = true;
                                } 
                            }
                        }
                    }
                }
            } 
            this.hasErrors = (this.hasDayError || this.hasMonthError || this.hasYearError);
            if (!this.hasErrors) {
                if (!this.isValidDate(this.day, this.month, this.year)) {
                    this.hasDayError = true;
                }
                this.hasErrors = (this.hasDayError || this.hasMonthError);
            }  
            this.showNotifications();
        }
    }

     @api
     checkValidNumbersUsed() {
        if (this.dayValue.length > 0) {
            if (this.containsAnyLetters(this.dayValue)) {
                this.dayErrorMsg = Non_numeric_day_error;
                this.hasDayError = true;  
            } else {
                if (this.dayValue.length > 2) {
                    this.dayErrorMsg = Invalid_day_error;
                    this.hasDayError = true;                      
                } else {
                    if (Number.isInteger(parseFloat(this.dayValue))) {
                        this.day = parseInt(this.dayValue, 10);
                    } else {
                        this.dayErrorMsg = Invalid_day_error;
                        this.hasDayError = true;  
                    }
                }
            }
        } else {
            this.dayErrorMsg = Invalid_day_error;
            this.hasDayError = true;  
        }
        if (this.monthValue.length > 0) {
            if (this.containsAnyLetters(this.monthValue)) {
                this.monthErrorMsg = Non_numeric_month_error;
                this.hasMonthError = true;  
            } else {
                if (this.monthValue.length > 2) {
                    this.monthErrorMsg = Invalid_month_error;
                    this.hasMonthError = true; 
                } else {
                    if (Number.isInteger(parseFloat(this.monthValue))) {
                        this.month = parseInt(this.monthValue, 10);
                    } else {
                        this.monthErrorMsg = Invalid_month_error;
                        this.hasMonthError = true;  
                    }
                }
            }
        } else {
            this.monthErrorMsg = Invalid_month_error;
            this.hasMonthError = true;  
        }
        if (this.yearValue.length > 0) {
            if (this.containsAnyLetters(this.yearValue)) {
                this.yearErrorMsg = Non_numeric_year_error;
                this.hasYearError = true;  
            } else {
                if (this.yearValue.length > 4) {
                    this.yearErrorMsg = Invalid_year_error;
                    this.hasYearError = true; 
                } else {
                    if (Number.isInteger(parseFloat(this.yearValue))) {
                        this.year = parseInt(this.yearValue, 10);
                    } else {
                        this.yearErrorMsg = Invalid_year_error;
                        this.hasYearError = true; 
                    }
                }
            }
        } else {
            this.yearErrorMsg = Invalid_year_error;
            this.hasYearError = true; 
        }
    }

     @api 
     containsAnyLetters(strInput) {
        let atleastOneAlpha =  (/\p{L}/u.test(strInput)); 
        if (!atleastOneAlpha) {
            // Check for any other non-numeric characters characters 
            let format = /[ `!@#$%^&*£()_+\-=\[\]{};':"\\|,.<>\/?~]/;
            atleastOneAlpha = format.test(strInput);
        }
        return atleastOneAlpha;
     }

     @api
     checkForValidDaysInMonth() {
        switch (this.month) {                      
            case 2:
                if (this.day < 0 || this.day > 29) {
                    this.dayErrorMsg = Invalid_day_error;
                    this.hasDayError = true;
                }
                break;
            case 4:
            case 6:
            case 9:
            case 11:
                if (this.day < 0 || this.day > 30) {
                    this.dayErrorMsg = Invalid_day_error;
                    this.hasDayError = true;
                }
                break;
            case 1:
            case 3:
            case 5:
            case 7:
            case 8:
            case 10:
            case 12:
                if (this.day < 0 || this.day > 31) {
                    this.dayErrorMsg = Invalid_day_error;
                    this.hasDayError = true;
                }
                break;
            default:
                this.monthErrorMsg = Invalid_month_error;
                this.hasMonthError = true;
                break;
        }
     }

     @api
     showNotifications() {
        if (this.hasDayError) {
            this.publishErrorMessage(this.dayFieldId, this.dayErrorMsg);
        } 
        if (this.hasMonthError) {
            this.publishErrorMessage(this.monthFieldId, this.monthErrorMsg);
        } 
        if (this.hasYearError) {
            this.publishErrorMessage(this.yearFieldId, this.yearErrorMsg);
        }
        if (!this.hasErrors) {
            this.publishEmptyMessage(this.fieldId);
            this.publishEmptyMessage(this.dayFieldId);
            this.publishEmptyMessage(this.monthFieldId);
            this.publishEmptyMessage(this.yearFieldId);
        } 
     }

     @api
     publishErrorMessage(idForField, errMsg) {
        this.errorMessages.push({
            key: idForField,
            target: idForField,
            detail: errMsg
        });
         publish(this.messageContext, VALIDATION_STATE_MC, {
            componentId: idForField,
            componentType: this.componentTypeName,
            componentSelect: this.componentSelectorName,
            isValid: false,
            error: errMsg
        });
     }

     @api
     publishEmptyMessage(idForField) {
        publish(this.messageContext, VALIDATION_STATE_MC, {
            componentId: idForField,
            isValid: true,
            error: ""
        });
     }

     @api 
     clearError() {
         this.hasErrors = false;
     }
     
 }