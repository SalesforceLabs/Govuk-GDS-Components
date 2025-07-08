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
    label ='';
    @api fontSize = 'Medium';
    @api h1Size = false;
    @api h2Size = false;
    @api h3Size = false;

    @api sectionName;
    @api instructionsHTML;
    @api destination;
    @api confirmationLabels =[];
    @api confirmationValues =[];
    @api confirmationDestinations =[];

    sectionFields;
    getAriaChangeSectionFieldLabel(){
        return "Change " + this.sectionField.label
    }

    // Styling

    get labelClass() {
        let labelClass;

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

    getHSize(){
        if(this.fontSize) {
            switch(this.fontSize.toLowerCase()) {
                case "small":
                    this.h3Size = true;
                    break;
                case "medium":
                    this.h2Size = true;
                    break;
                case "large":
                    this.h1Size = true;
                    break;
                default:
                    this.h3Size = true;
            }
        } else {
            this.h3Size = true;
        }
    }

    // end Styling


    connectedCallback() {
        // sets the H value for template based on labele font size  
        this.getHSize(); 
        this.label = this.title // This is to reuse the code from other components that have H1, H2, H3 implemented & cannot change already packaged API
        
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