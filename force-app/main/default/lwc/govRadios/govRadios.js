/**
 * Component Name: Gov UK Radios
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Neetesh Jain/Brenda Campbell
 **/
import {LightningElement, api, track, wire} from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import getPicklistValuesMapByObjectField from '@salesforce/apex/GovComponentHelper.getPicklistValuesMapByObjectField';
import { MessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import REGISTER_MC from '@salesforce/messageChannel/registrationMessage__c';
import UNREGISTER_MC from '@salesforce/messageChannel/unregistrationMessage__c';
import VALIDATION_MC from '@salesforce/messageChannel/validateMessage__c';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';
import SET_FOCUS_MC from '@salesforce/messageChannel/setFocusMessage__c';

export default class GovRadios extends LightningElement {
    static delegatesFocus = true;
    @api uniqueFieldId = "radioField";
    @api radioFieldId = "picklist-value";
    radioFieldIdForFocus;
    @api questionLabel;
    @api questionFontSize;
    @api questionHint;
    @api requiredQuestion;
    @api inlineRadios;
    @api smallerRadios;
    @api radioPicklistField;
    @api radioLabels = "";
    @api radioValues = "";
    @api selectedValue = "";  
    @api selectedValueAPIName = "";  
    @api errorMessage;

    @api h1Size = false;
    @api h2Size = false;
    @api h3Size = false;
    
    @track isInitialised = false;
    @track hasErrors = false;
    @track radioOptions = [];



    
    get groupClass() {
        let groupClass = "govuk-form-group";
        groupClass = (this.hasErrors) ? groupClass + " govuk-form-group--error" : groupClass;
        return groupClass;
    }

    get questionLabelClass() {
        let questionLabelClass;
        switch(this.questionFontSize.toLowerCase()) {
            case "small":
                questionLabelClass = "govuk-label govuk-label--s";
                break;
            case "medium":
                questionLabelClass = "govuk-label govuk-label--m";
                break;
            case "large":
                questionLabelClass = "govuk-label govuk-label--l";
                break;
            default:
                questionLabelClass = "govuk-label govuk-label--s";
        }
        return questionLabelClass;
    }

    get radioClass() {
        let radioClass = "govuk-radios";
        radioClass = (this.inlineRadios) ? radioClass + " govuk-radios--inline" : radioClass;
        radioClass = (this.smallerRadios) ? radioClass + " govuk-radios--small" : radioClass;
        return radioClass;
    }

    getHSize(){
        if(this.questionFontSize) {
            switch(this.questionFontSize.toLowerCase()) {
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
    
    // messaging attributes
    @wire(MessageContext) messageContext;
    validateSubscription;
    setFocusSubscription;

    connectedCallback() {
        // sets the H value for template based on label font size  

        this.getHSize(); 

        if(this.radioPicklistField !== '' && this.radioPicklistField !== undefined && this.radioPicklistField !== null) {
            // get picklist field values
            getPicklistValuesMapByObjectField({
                strSObjectFieldName: this.radioPicklistField
            })
                .then(result => {
                    
                    this.radioOptions = [];
                    
                    let i=0;

                    for(const label in result) {
                        let radioOption = {};
                        radioOption.key = `picklist-value-${i}`;
                        radioOption.value = label; 
                        radioOption.label = label;
                        radioOption.APIName = result[label];
                        
                        radioOption.checked = (this.selectedValue === label); 
                        
                        this.radioOptions.push(radioOption);
                        if (i==0) {
                            this.radioFieldId = radioOption.key;
                        }
                        i++;
                    }
                    this.isInitialised = true;

                })
                .catch(error => {
                    console.error(`Select:connectedCallback - could not get picklist values due to ${error.message}`);
                })
        } else {
            // user provided values
            const radioLabelsArray = this.radioLabels.split(',');
            const radioValuesArray = this.radioValues.split(',');
            this.radioOptions = [];
            for(let i=0; i<radioLabelsArray.length;i++) {
                let radioOption = {};
                radioOption.key = `csv-value-${i}`;
                radioOption.label = radioLabelsArray[i];
                radioOption.value = radioValuesArray[i];
                // console.log(' !!!!!! radioValuesArray[i]: ' + radioValuesArray[i]);
                radioOption.checked = (this.selectedValue === radioValuesArray[i]);
                this.radioOptions.push(radioOption);
                if (i==0) {
                    this.radioFieldId = radioOption.key;
                }
            }
            this.isInitialised = true;
        }

        // subscribe to the message channels
        this.subscribeMCs();
        
        this.register();
        // // publish the registration message after 0.1 sec to give other components time to initialise
        // setTimeout(() => {
        //     publish(this.messageContext, REGISTER_MC, { componentId: this.uniqueFieldId }); //radioFieldIdForFocus //m  radioFieldId
        // }, 100);
    }

    renderedCallback(){
        setTimeout(() => {
            
            
                // getting ID of component's field and setting to pass to govErrorMessage comp
                let allRadioFieldComps = this.template.querySelectorAll('input[name="'+this.uniqueFieldId+'"]');

                //renderedCallback can be called multiple times, including before/after wire service has returned data (i.e. if picklist field is used)
                //so only run this when radioOptions populated
                if(allRadioFieldComps.length > 0){

                    for(let i=0; i<allRadioFieldComps.length; i++) {
                        // show all properties of single allRadioFieldComps[i]
                        // console.log('allRadioFieldComps[i]: ' + allRadioFieldComps[i]);
                        let radioFieldComp = allRadioFieldComps[i];
                        // console.log('radioFieldComp.id: ' + radioFieldComp.id);
                        // console.log('radioFieldComp.name: ' + radioFieldComp.name);
                        // console.log('radioFieldComp.value: ' + radioFieldComp.value);
                        // console.log('radioFieldComp.checked: ' + radioFieldComp.checked);
                        // console.log('radioFieldComp.type: ' + radioFieldComp.type);
                        // console.log('radioFieldComp.required: ' + radioFieldComp.required);
                        // console.log('radioFieldComp.disabled: ' + radioFieldComp.disabled);
                        // console.log('radioFieldComp.form: ' + radioFieldComp.form);
                        // console.log('radioFieldComp.indeterminate: ' + radioFieldComp.indeterminate);
                        // console.log('   ');
                        // console.log('---');
                    
                    }

                    // console.log('allRadioFieldComps[0].id: ' + allRadioFieldComps[0].id);
                    this.radioFieldIdForFocus = allRadioFieldComps[0].id;
                }
           
        }, 100);
    }

    disconnectedCallback() {
        this.unregister();
        this.unsubscribeMCs();
    }

    handleValueChanged(event) {
        this.selectedValue = event.target.value;

        this.radioOptions.forEach(radioOption => {
           if(radioOption.value === this.selectedValue) {
               radioOption.checked = true;
               this.selectedValueAPIName = radioOption.APIName;

           } else {
               radioOption.checked = false;
           }
        });
        this.dispatchRadioEvent();
    }

    @api 
    setValue(newValue) {
        this.selectedValue = newValue;
        this.radioOptions.forEach( option => {
            if(option.value === newValue) {
                option.checked = true;
                this.selectedValueAPIName = option.APIName;
            } else {
                option.checked = false;
            }
        })
    }

    handleValidateMessage(message) {
        this.handleValidate();
    }

    @api 
    handleValidate() {
        this.clearError();
        // this.hasErrors = false;
        console.log('***** handleValidate this.requiredQuestion:" '+ this.requiredQuestion + '" this.selectedValue: "' + this.selectedValue + '" ' );

        if(this.requiredQuestion && (this.selectedValue === '' || this.selectedValue === undefined)) {
             console.log('Inside handleValidate still has errors: ' + this.requiredQuestion + ' selectedValue' + this.selectedValue + ' ' );
            this.hasErrors = true;
        }
        console.log('Publishing handleValidate this.uniqueFieldId '+ this.uniqueFieldId + ' this.hasErrors: ' +this.hasErrors + ' this.errorMessage: ' + this.errorMessage);
        console.log('this.radioFieldIdForFocus: ' + this.radioFieldIdForFocus);
        publish(this.messageContext, VALIDATION_STATE_MC, {
            componentId: this.uniqueFieldId,
            isValid: !this.hasErrors,
            error: this.errorMessage,
            focusId: this.radioFieldIdForFocus
        });
        return !this.hasErrors;
    }

    @api 
    clearError() {
        this.hasErrors = false;
    }

    dispatchRadioEvent() {
        // tell the flow engine about the change (label value)
        const attributeChangeEvent = new FlowAttributeChangeEvent('selectedValue', this.selectedValue);
        this.dispatchEvent(attributeChangeEvent);

        const attributeChangeEventAPIName = new FlowAttributeChangeEvent('selectedValueAPIName', this.selectedValueAPIName);
        this.dispatchEvent(attributeChangeEventAPIName);

        console.log('dispatched FlowAttributeChangeEvent',attributeChangeEventAPIName);

        // tell any parent components about the change
        const valueChangedEvent = new CustomEvent('valuechanged', {
            detail: {
                id: this.uniqueFieldId,
                value: this.selectedValue,
                valueAPIName: this.selectedValueAPIName
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
            //publish(this.messageContext, REGISTER_MC, {componentId:this.fieldId});
            publish(this.messageContext, REGISTER_MC, {componentId:this.uniqueFieldId});
        }, 100);
    }

    //inform subscribers that this comoponent is no longer available
    unregister() {
        // console.log('govRadios: unregister',this.uniqueFieldId);

        //have to create a new message context to unregister
        publish(createMessageContext(), UNREGISTER_MC, { componentId: this.uniqueFieldId });
    }

    handleSetFocusMessage(message){
        // filter message to check if our component (id) needs to set focus
        console.log('handleSetFocusMessage message.componentId: ' + message.componentId + ' this.radioFieldIdForFocus: ' + this.radioFieldIdForFocus + ' this.uniqueFieldId: ' + this.uniqueFieldId + ' this.radioFieldId: ' + this.radioFieldId);
        // if(message.componentId !== this.radioFieldIdForFocus && message.componentId !== this.radioFieldId && message.componentId !== this.uniqueFieldId){
        //     return;
        // }
        //let myComponentId = message.componentId;
        console.log(' ');
console.log('message.focusId: '+ message.focusId + ' this.radioFieldIdForFocus: ' + this.radioFieldIdForFocus);
console.log(' ');
        let myComponentId = message.focusId;
        if(myComponentId == this.radioFieldIdForFocus){
            console.dir(message);
            let myComponent = this.template.querySelector('input');
            console.log('myComponent: ' + myComponent);
            myComponent.focus();
        }
    }

}