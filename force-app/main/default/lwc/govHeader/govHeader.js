/**
 * Component Name: Gov UK Header
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Neetesh Jain/Brenda Campbell
 **/
import {LightningElement, api, track} from 'lwc';
import {NavigationMixin} from "lightning/navigation";
import communityBasePath from '@salesforce/community/basePath';
import CROWN_LOGO from '@salesforce/resourceUrl/govuklogotypecrown';
import getDefaultMenuItems from '@salesforce/apex/GovComponentHelper.getDefaultMenuItems';

export default class GovHeader extends NavigationMixin(LightningElement) {
    
    crownLogo = CROWN_LOGO;

    // refs #67 proto
    @api headerBannerRole = ''; // deprecated
    @api displayMenu;
    
    @api headerLabel = "GOV.UK";
    @api headerURL = "#";
    @api serviceName = "Service Name";
    @api serviceURL = "#";
    @api menuLabel = "Menu";
    @api navigationMenuDevName = "Default_Navigation";
    
    @track menuItems = [];
    @track showMenuInMobile = false;
  
    connectedCallback() {
        getDefaultMenuItems({
            strNavigationMenuDevName: this.navigationMenuDevName
        })
            .then(menuItems => {
                try {
                    // get the page title
                    let urlParts = window.location.href.split("/");
                    let pageTarget = `/${urlParts.pop()}`;
                    pageTarget = pageTarget.split('#')[0];

                    // update the menu item's url for this community's base path and activate the target page menu item
                    menuItems.forEach(menuItem => {
                        menuItem.class = (menuItem.Target === pageTarget) ? "govuk-header__navigation-item govuk-header__navigation-item--active" : "govuk-header__navigation-item";
                        menuItem.fullTarget = (menuItem.Type === "InternalLink") ? (communityBasePath + menuItem.Target) : (menuItem.Target);
                        menuItem.targetPref = (menuItem.Type === "ExternalLink" &&  menuItem.TargetPrefs === "None") ? "_blank"  : "_self";
                    });
                    this.menuItems = menuItems;
                    
                } catch (err) {
                    console.error(err);
                }
            })
            .catch(error => {
                console.error(`Could not load menu items due to ${JSON.stringify(error)}`);
            })
    }

    toggleButton(event) {
        if(this.showMenuInMobile) {
            this.showMenuInMobile = false;
            this.template.querySelector('.govuk-header__navigation').classList.remove('govuk-header__navigation--open');
        } else {
            this.showMenuInMobile = true;
            this.template.querySelector('.govuk-header__navigation').classList.add('govuk-header__navigation--open');
        }
        
    }

}