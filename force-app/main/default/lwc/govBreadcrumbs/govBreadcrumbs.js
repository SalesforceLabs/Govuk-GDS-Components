/**
 * Component Name: Gov UK Breadcrumbs
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Neetesh Jain/Brenda Campbell
 **/
import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class GovBreadcrumbs extends NavigationMixin(LightningElement) {

    @api pageLabels = "";
    @api pageAPINames = "";

    @track pathItems = [];

    connectedCallback() {
        try {
            // get the page Labels and API Names
            let pageLabs = this.pageLabels.split(";");
            let pageNames = this.pageAPINames.split(";");
            
            for (let i = 0; i < pageLabs.length; i++) {
                this.pathItems.push({
                    pageLabel: pageLabs[i],
                    pageName: pageNames[i]
                });
            }
        } catch (err) {
            console.error(err);
        }
    }

    handleClick(event) {
        event.preventDefault();
        if(event.currentTarget.dataset.id && event.currentTarget.dataset.id !== '#') {
            this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: {
                    name: event.currentTarget.dataset.id
                },
                state: {
                }
            });
        }
    }

}