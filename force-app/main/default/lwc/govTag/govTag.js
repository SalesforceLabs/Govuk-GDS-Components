/**
 * Component Name: Gov UK Tag
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Harshpreet Singh Chhabra/Brenda Campbell
 **/
import { LightningElement,api,track } from 'lwc';

export default class GovTag extends LightningElement {

    @api tagText = '';
    @api tagTextColour = 'Default';

    @track tagClass = "govuk-tag";

    connectedCallback(){
      
            if(this.tagTextColour.toUpperCase() === 'GREY') {
                this.tagClass += " govuk-tag--grey";
            } else if(this.tagTextColour.toUpperCase() === 'GREEN') {
                this.tagClass += " govuk-tag--green";
            } else if(this.tagTextColour.toUpperCase() === 'TURQUOISE') {
                this.tagClass += " govuk-tag--turquoise";
            } else if(this.tagTextColour.toUpperCase() === 'BLUE'){
                this.tagClass += " govuk-tag--blue";
            } else if(this.tagTextColour.toUpperCase() === 'PURPLE') {
                this.tagClass += " govuk-tag--purple";
            } else if(this.tagTextColour.toUpperCase() === 'PINK') {
                this.tagClass += " govuk-tag--pink";
            } else if(this.tagTextColour.toUpperCase() === 'RED'){
                this.tagClass += " govuk-tag--red";
            } else if(this.tagTextColour.toUpperCase() === 'ORANGE') {
                this.tagClass += " govuk-tag--orange";
            } else if(this.tagTextColour.toUpperCase() === 'YELLOW'){
                this.tagClass += " govuk-tag--yellow";
            } else {
                this.tagClass += "";
            }
    }
}