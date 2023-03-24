/**
 * Component Name: Gov UK Home Tile 
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Neetesh Jain/Brenda Campbell
 **/
import {LightningElement, api, track} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class GovTile extends LightningElement {
    @api label;
    @api link;

    @api tileTextColour = 'Default';
    @track tileClass = "govuk-tile";
    @api tileType = 'Title';
    connectedCallback(){    
      
        if(this.tileTextColour.toUpperCase() === 'GREY') {
            this.tileClass += " govuk-tile--grey";
        } else if(this.tileTextColour.toUpperCase() === 'GREEN') {
            this.tileClass += " govuk-tile--green";
        } else if(this.tileTextColour.toUpperCase() === 'TURQUOISE') {
            this.tileClass += " govuk-tile--turquoise";
        } else if(this.tileTextColour.toUpperCase() === 'BLUE') {
            this.tileClass += " govuk-tile--blue";
        } else if(this.tileTextColour.toUpperCase() === 'PURPLE') {
            this.tileClass += " govuk-tile--purple";
        } else if(this.tileTextColour.toUpperCase() === 'LIGHT BLUE') {
            this.tileClass += " govuk-tile--light-blue";
        } else if(this.tileTextColour.toUpperCase() === 'LIGHT PURPLE') {
            this.tileClass += " govuk-tile--light-purple";
        } else if(this.tileTextColour.toUpperCase() === 'PINK') {
            this.tileClass += " govuk-tile--pink";
        } else if(this.tileTextColour.toUpperCase() === 'DARK PINK') {
            this.tileClass += " govuk-tile--dark-pink";
        } else if(this.tileTextColour.toUpperCase() === 'LIGHT PINK') {
            this.tileClass += " govuk-tile--light-pink";
        } else if(this.tileTextColour.toUpperCase() === 'RED') {
            this.tileClass += " govuk-tile--red";
        } else if(this.tileTextColour.toUpperCase() === 'ORANGE') {
            this.tileClass += " govuk-tile--orange";
        } else if(this.tileTextColour.toUpperCase() === 'YELLOW') {
            this.tileClass += " govuk-tile--yellow";
        } else {
            this.tileClass += "";
        }

        if(this.tileType.toUpperCase() === 'TITLE') {
            this.tileClass += " govuk-tile_type--title";
        } else if(this.tileType.toUpperCase() === 'CONTENT') {
            this.tileClass += " govuk-tile_type--content";
        }
    }

    handleClick(event) {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: this.link
            },
            state: {
            }
        });
    }
}