/**
 * Component Name: Gov UK Summary List
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Harshpreet Singh Chhabra/Brenda Campbell
 **/
import {LightningElement, api, track} from 'lwc';
import {FlowNavigationNextEvent} from 'lightning/flowSupport';
//import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class GovSummary extends LightningElement {
    @api availableActions = []

    @api title;
    @api sectionName;
    @api instructionsHTML;
    @api destination;
    @api confirmationLabels =[];
    @api confirmationValues =[];
    @api confirmationDestinations =[];

    sectionFields;

    connectedCallback() {
        this.sectionFields = [];
        // create the section fields from the collections
        //console.log("Creating fields")
        for(var index = 0; index < this.confirmationLabels.length; index++) {
            //console.log("Adding new confirmation field");
            var sectionField = {};
            sectionField.key = index;
            sectionField.label = this.confirmationLabels[index];
            sectionField.value = this.confirmationValues[index];
            sectionField.destination = this.confirmationDestinations[index];
            this.sectionFields.push(sectionField);
        }
    }

    renderedCallback() {
        //insert the instructions HTML
        if(this.instructionsHTML) {
            //console.log(`setting html instructions`);
            const htmlElement = this.template.querySelector(".html-element");
            if(htmlElement) {
                htmlElement.innerHTML = this.instructionsHTML;
                //console.log(`done it`);
            }
        }
    }

    handleChange(event) {

        this.destination = event.target.getAttribute('data-destination');

        //console.log(`processing handleChange event for ${this.destination}`);
       
        //this.dispatchEvent(new FlowAttributeChangeEvent('outputValue', this.destination));

        if (this.availableActions.find(action => action === 'NEXT')) {
            //console.log(`sending next event to flow engine. - handleChange `);
            const nextNavigationEvent = new FlowNavigationNextEvent();
            this.dispatchEvent(nextNavigationEvent);
        }
    }

    handleSend(event) {
        // next flow
        //console.log(`sending next event to flow engine. - handleSend`);
        this.destination = "Default_Screen";
        const nextNavigationEvent = new FlowNavigationNextEvent();
        this.dispatchEvent(nextNavigationEvent);
    }

}