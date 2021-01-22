import {LightningElement,api, track} from 'lwc';
import BASEPATH from '@salesforce/community/basePath';
import getDefaultMenuItems from '@salesforce/apex/govComponentHelper.getDefaultMenuItems';
import CROWN_LOGO from '@salesforce/resourceUrl/govuklogotypecrown';

export default class GovHeader extends LightningElement {
    crownLogo = CROWN_LOGO;

    @api serviceName = "Service Name Goes Here";

    @track menuItems = [];

    connectedCallback() {
        getDefaultMenuItems()
            .then(menuItems => {
                try {
                    // get the page title
                    let urlParts = window.location.href.split("/");
                    let pageTarget = `/${urlParts.pop()}`;
                    pageTarget = pageTarget.split('#')[0];

                    // put the home in
                    menuItems.splice(0,0,{Label:"Home",Target:"/",Id:"Home"});

                    // update the url for this community's base path
                    menuItems.forEach( menuItem => {
                        menuItem.class = (menuItem.Target === pageTarget) ? "govuk-header__navigation-item govuk-header__navigation-item--active": "govuk-header__navigation-item";
                        menuItem.FullTarget = BASEPATH + menuItem.Target;
                    });
                    this.menuItems = menuItems;
                    }
                catch(err) {
                    console.error(err);
                }
            })
            .catch(error => {
                console.error(`Could not load menu items due to ${JSON.stringify(error)}`);
            })
    }
}
