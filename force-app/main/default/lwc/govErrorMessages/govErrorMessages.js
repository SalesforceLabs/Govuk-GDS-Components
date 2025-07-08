/**
 * Component Name: Gov UK Error Messages
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Neetesh Jain/Brenda Campbell
 **/
import { LightningElement, api, track, wire } from 'lwc';
import { MessageContext,publish, subscribe, unsubscribe } from 'lightning/messageService';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';
import VALIDATE_MC from '@salesforce/messageChannel/validateMessage__c';
import SET_FOCUS_MC from '@salesforce/messageChannel/setFocusMessage__c';
import Error_summary_title from '@salesforce/label/c.uxg_Error_summary_title';
import './govErrorMessages.css';
import cookiesAccept from '@salesforce/messageChannel/cookiesAccept__c';

export default class ErrorMessages extends LightningElement {

    // handle the on focus coloring
    @track highlightedLinkClass = '';
    handleLinkFocus() {
        this.highlightedLinkClass = 'highlighted-link';
    }
    handleLinkBlur() {
        this.highlightedLinkClass = '';
    }

    components = [];
    errorPrefix = Error_summary_title;

    // messaging attributes
    @wire(MessageContext) messageContext;
    errorSubscription;
     
    connectedCallback() {
        requestAnimationFrame(() => {
            const nestedTemplate = this.template.querySelector('template');
            if (nestedTemplate) {
                const someOtherNameElement = nestedTemplate.content.querySelector('a[name="errorSummaryTitle"]');
                if (someOtherNameElement) {
                    console.log('Element found:', someOtherNameElement);
                } else {
                    console.error('Element not found.');
                }
            } else {
                console.error('Nested template not found.');
            }
        });
        this.subscribeMCs();
    }

    disconnectedCallback() {
        this.unsubscribeMCs();
    }

    get hasErrors() {
        return (this.components.filter(component => component.isValid === false).length > 0);
    }

    subscribeMCs() {
        if (this.errorSubscription) {
            return;
        }
        this.errorSubscription = subscribe(
            this.messageContext,
            VALIDATION_STATE_MC, (message) => {
                // console.log('message.componentId: '+  message.componentId);
                // console.log('message.focusId: '+ message.focusId);
                this.handleValidationStateMessage(message);
            });
        if (this.validateSubscription) {
            return;
        }
        this.validateSubscription = subscribe (
            this.messageContext,
            VALIDATE_MC, (message) => {
                // console.log('message.componentId: '+  message.componentId);
                // console.log('message.focusId: '+ message.focusId);
                this.handleValidateMessage(message);
            });
    }

    unsubscribeMCs() {
        unsubscribe(this.errorSubscription);
        this.errorSubscription = null;
    }

    putFocusOnError(){
        window.setTimeout(()=> {
            const myComponent = this.template.querySelector('.govuk-error-summary');
            console.log("myComponent: " + myComponent);
            if(myComponent){
                myComponent.focus();
            }
        },0);
    }
    // called during validation to update error states and messages
    handleValidationStateMessage(message) {
        
        const component = this.components.find(component => component.id === message.componentId);
        
        if(component) {
            if(message.isValid === true) {
                this.components = this.components.filter(component => component.id !== message.componentId);
            } else {
                // console.log('Component is not valid.');
                component.isValid = message.isValid;
                component.error = message.error;
                component.focusId = message.focusId;
                // console.log('component.focusId: ', message.focusId);
                // console.log('component.id: ', message.id);
            }
        } else {
            if(message.isValid === false) {
                const component = {};
                component.id = message.componentId;
                // console.log('message.componentId: ', message.componentId);
                // console.log('component.id: ', component.id);
                component.isValid = message.isValid;
                component.error = message.error;
                component.componentType = message.componentType;
                component.componentSelect = message.componentSelect;
                component.focusId = message.focusId;
                // console.log('component.focusId: ', message.focusId);
                this.components.push(component);
                
            }
        }
    }

    // called at the start of validation to remove existing errors
    handleValidateMessage(message) {
        console.log("message: ");
        console.log(message);
        if (message.componentId =="NavigationButtons"){
            console.log("--- NavigationButtons ---");
            this.putFocusOnError();
        }
        // check if message has error!
        
        this.components = [];
    }

    handleClick(event) {
        // console.log('event.target: ', event.target);
        // console.log('event.target.dataset.targetId: ', event.target.dataset.targetId);
        // console.log('event.target.dataset: ', event.target.dataset);
        let myDataSet =  event.target.dataset;
        let targetId = event.target.dataset.targetId; // Component id, i.e. input-text-18, date-input-day-47, date-input-month-47
        // console.log('targetId from govErrorMessages: ', targetId);
        publish(this.messageContext, SET_FOCUS_MC, { componentId: targetId, focusId: targetId });
    }
}