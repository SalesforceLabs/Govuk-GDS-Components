/**
 * Component Name: Gov UK Tabs
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Neetesh Jain/Brenda Campbell
 **/
import { LightningElement, api, track } from 'lwc';

export default class GovTabs extends LightningElement {

    @api title = "";
    @api titleSize = "Large";
    @api tabNames = "";
    @api tabData = "";

    @track data = [];

    get titleClass() {
        let titleClass;
        switch(this.titleSize.toLowerCase()) {
            case "small":
                titleClass = "govuk-heading-s";
                break;
            case "medium":
                titleClass = "govuk-heading-m";
                break;
            case "large":
                titleClass = "govuk-heading-l";
                break;
            default:
                titleClass = "govuk-heading-l";
        }
        return titleClass;
    }

    connectedCallback() {
        try {
            // get the page Labels and API Names
            let tabs = this.tabNames.split("|");
            let data = this.tabData.split("|");
            
            for (let i = 0; i < tabs.length; i++) {
                this.data.push({
                    heading: tabs[i],
                    bodyText: data[i],
                    headerClass: (i === 0) ? "govuk-tabs__list-item govuk-tabs__list-item--selected" : "govuk-tabs__list-item",
                    tabClass: (i === 0) ? "govuk-tabs__tab govuk-tabs_focus" : "govuk-tabs__tab govuk-tabs_underline", 
                    bodyClass: (i === 0) ? "govuk-tabs__panel" : "govuk-tabs__panel--hidden"
                });
            }
        } catch (err) {
            console.error(err);
        }
    }

    handleTabSelection(event) {
        this.template.querySelectorAll('.govuk-tabs__list-item--selected').forEach(element => {
            element.classList.remove("govuk-tabs__list-item--selected");
        });
        
        this.template.querySelectorAll('.govuk-tabs__tab').forEach(element => {
            element.classList.remove("govuk-tabs_focus");
            element.classList.add("govuk-tabs_underline");
        });

        this.template.querySelectorAll('.govuk-tabs__panel').forEach(element => {
            element.classList.remove("govuk-tabs__panel"); 
            element.classList.add("govuk-tabs__panel--hidden");
        });
          
        this.template.querySelectorAll(`[data-id="${event.currentTarget.dataset.id}"]`).forEach(element => {
            if(element.classList[0] === "govuk-tabs__list-item") {
                element.classList.remove("govuk-tabs_underline"); 
                element.classList.add("govuk-tabs__list-item--selected");    
            }
            if(element.classList[0] === "govuk-tabs__tab") {
                element.classList.remove("govuk-tabs_underline"); 
                element.classList.add("govuk-tabs_focus");  
            }
        });
    
        this.template.querySelectorAll(`[data-id="${event.currentTarget.dataset.id}"]`).forEach(element => {
            if(element.classList[0] === "govuk-tabs__panel--hidden") {
                element.classList.remove("govuk-tabs__panel--hidden");
                element.classList.add("govuk-tabs__panel"); 
            }
        });  
    }
    
}