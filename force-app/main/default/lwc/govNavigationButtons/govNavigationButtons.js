/**
 * Component Name: Gov UK Navigation Buttons
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Harshpreet Singh Chhabra/Brenda Campbell
 **/
import {LightningElement, api, track, wire} from 'lwc';
import { FlowNavigationBackEvent, FlowNavigationNextEvent, FlowNavigationFinishEvent } from 'lightning/flowSupport';
import { MessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import REGISTER_MC from '@salesforce/messageChannel/registrationMessage__c';
import VALIDATE_MC from '@salesforce/messageChannel/validateMessage__c';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';

export default class GovNavigationButtons extends LightningElement {
    // flow actions
    @api availableActions = [];

    // messaging attributes
    @wire(MessageContext) messageContext;
    registrationSubscription;
    validationStateSubscription;

    // flow inputs and outputs
    @api buttonLabelsString;
    @api buttonActionsString;
    @api buttonVariantsString;
    @api buttonAlignmentsString;
    @api action;
    @api fieldId = 'NavigationButtons';
    @api useFlowStyling;
    @api fullWidth = false;

    // tracked attributes
    @track leftButtons = [];
    @track centerButtons = [];
    @track rightButtons = [];

    // other attributes
    components = [];

    // Lifecycle listeners

    connectedCallback() {
        // subscribe to registration events
        this.subscribeMCs()

        // bug out if no configuration string
        if(!this.buttonActionsString ||
            !this.buttonLabelsString ||
            !this.buttonVariantsString ||
            !this.buttonAlignmentsString) {
            return;
        }

        // create the object base on the csv
        const buttonAlignments = this.buttonAlignmentsString.split(',');
        const buttonLabels = this.buttonLabelsString.split(',');
        const buttonActions = this.buttonActionsString.split(',');
        const buttonVariant = this.buttonVariantsString.split(',');

        // create the button definition
        this.leftButtons = [];
        this.centerButtons = [];
        this.rightButtons = [];

        for(let i=0; i<buttonAlignments.length; i++) {
            let button = {};
            button.key = i;
            button.label = buttonLabels[i];
            button.action = buttonActions[i];
            button.variant = buttonVariant[i];
            if(button.variant.toUpperCase() === 'BRAND') {
                button.class = 'govuk-button govuk-!-margin-1';
            } else if(button.variant.toUpperCase() === 'SECONDARY') {
                button.class = 'govuk-button govuk-button--secondary govuk-!-margin-1';
            } else if(button.variant.toUpperCase() === 'WARNING') {
                button.class = 'govuk-button govuk-button--warning govuk-!-margin-1';
            } else if(button.variant.toUpperCase() === 'DISABLED'){
                button.class = 'govuk-button govuk-button--disabled govuk-!-margin-1';
            } else {
                button.class = 'govuk-button govuk-!-margin-1';
            }
            if(buttonAlignments[i].toUpperCase() === 'LEFT') {
                this.leftButtons.push(button);
            } else if(buttonAlignments[i].toUpperCase() === 'CENTER') {
                this.centerButtons.push(button);
            } else if(buttonAlignments[i].toUpperCase() === 'RIGHT') {
                this.rightButtons.push(button);
            } else {
                this.rightButtons.push(button);
            }
        }
    }

    disconnectedCallback() {
        this.unsubscribeMCs();
    }


    // class related functions
    get containerWidthClass() {
        return (this.fullWidth) ? "" : "govuk-grid-column-two-thirds";
    }

    // Event handlers functions
    handleClick(event) {
        // get the action for the data-action attribute
        this.action = event.target.getAttribute('data-action').toUpperCase();
        // check to see if next or finish was selected and we have components to validate
        if( (this.action === 'NEXT' || this.action === 'FINISH') && this.components.length > 0 ) {
            this.components.forEach(component => {
                component.isValid = false;
            })
            //console.log('NAVIGATION_BUTTONS: Sending validation message ' + this.fieldId );
            publish(this.messageContext, VALIDATE_MC, { componentId: this.fieldId });
        } else if(this.action === 'NEXT' && this.availableActions.find(action => action === 'NEXT')) {
            const event = new FlowNavigationNextEvent();
            this.dispatchEvent(event);
        } else if(this.action === 'FINISH' && this.availableActions.find(action => action === 'FINISH')) {
            const event = new FlowNavigationFinishEvent();
            this.dispatchEvent(event);
        } else if (this.action === 'CANCEL' &&
            (this.availableActions.find(action => action === 'NEXT'))) {
            const event = new FlowNavigationNextEvent();
            this.dispatchEvent(event);
        } else if (this.action === 'CANCEL' &&
            (this.availableActions.find(action => action === 'FINISH'))) {
            const event = new FlowNavigationFinishEvent();
            this.dispatchEvent(event);
        } else if (this.action === 'BACK' &&
            this.availableActions.find(action => action === 'BACK')) {
            const event = new FlowNavigationBackEvent();
            this.dispatchEvent(event);
        }
    }


    // Messaging related functions
    subscribeMCs() {
        if (this.registrationSubscription) {
            return;
        }
        this.registrationSubscription = subscribe (
            this.messageContext,
            REGISTER_MC, (message) => {
                this.handleRegistrationMessage(message);
            });
        if (this.validationStateSubscription) {
            return;
        }
        this.validationStateSubscription = subscribe (
            this.messageContext,
            VALIDATION_STATE_MC, (message) => {
                this.handleValidationUpdate(message);
            });
    }

    unsubscribeMCs() {
        unsubscribe(this.registrationSubscription);
        this.registrationSubscription = null;
        unsubscribe(this.validationStateSubscription);
        this.validationStateSubscription = null;
    }


    handleRegistrationMessage(message) {
        //console.log(`NAVIGATION_BUTTONS: Received registration message from component ${JSON.stringify(message)}`);
        const component = {};
        component.id = message.componentId;
        component.isValid = true;
        component.error = "";
        this.components.push(component);
        //console.log(`NAVIGATION_BUTTONS: Component are ${JSON.stringify(this.components)}`);
    }

    handleValidationUpdate(message) {
        //console.log(`NAVIGATION_BUTTONS: Received validation state message from component ${JSON.stringify(message)}`);
        // update the component that sent the message
        const component = this.components.find(component => component.id === message.componentId);
        if(component) {
            //console.log(`NAVIGATION_BUTTONS: Setting component ${component.id} to ${message.isValid}`);
            component.isValid = message.isValid;
        } else {
            //console.log(`NAVIGATION_BUTTONS: This shouldn't really happen but creating new component ${message.componentId} with status ${message.isValid}`);
            this.components.push({id:message.componentId,isValid:message.isValid});
        }
        //console.log(`NAVIGATION_BUTTONS: components are ${JSON.stringify(this.components)}`);
        // check to see if we have all valid components
        const invalidComponents = this.components.filter(component => component.isValid === false);
        
        if(invalidComponents.length === 0) {
            //console.log(`NAVIGATION_BUTTONS: All components are valid, moving along, action is ${this.action}`);
            if (this.action === 'NEXT' &&
                this.availableActions.find(action => action === 'NEXT')) {
                const event = new FlowNavigationNextEvent();
                this.dispatchEvent(event);
            } else if (this.action === 'NEXT' &&
                this.availableActions.find(action => action === 'FINISH')) {
                const event = new FlowNavigationFinishEvent();
                this.dispatchEvent(event);
            } else if (this.action === 'FINISH' &&
                this.availableActions.find(action => action === 'FINISH')) {
                const event = new FlowNavigationFinishEvent();
                this.dispatchEvent(event);
            }
        } else {
            //console.log(`NAVIGATION_BUTTONS: There are invalid components.`);
        }
    }

}