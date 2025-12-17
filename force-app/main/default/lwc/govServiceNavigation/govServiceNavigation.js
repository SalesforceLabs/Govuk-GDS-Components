/**
 * Component Name: Gov UK Service Navigation
 **/
import { LightningElement, api, track } from 'lwc';
import getDefaultMenuItems from '@salesforce/apex/GovComponentHelper.getDefaultMenuItems';
import sitePath from '@salesforce/community/basePath';

class NavigationItem {
    label;
    href;
    target;
    targetPrefs;
    type;
    selected;
    class;
    constructor(rec, selected, communityBasePath) {
        this.label = rec.Label;

        if (rec.Type === 'ExternalLink') {
            this.href = rec.Target;
        } else if (rec.Type === 'InternalLink') {
            this.href = `${communityBasePath}${rec.Target}`;
        } else {
            this.href = rec.Target;
        }
        this.target = rec.Type === 'ExternalLink' && rec.TargetPrefs === 'None' ? '_blank' : '_self';
        this.targetPrefs = rec.TargetPrefs;
        this.type = rec.Type;
        this.id = rec.Id;
        this.selected = selected;
        this.class = selected === true ? 'govuk-service-navigation__item govuk-service-navigation__item--active' : 'govuk-service-navigation__item'; 
        }
}

class ClickedTarget {
    label;
    href;
    type;
    targetPrefs;
    constructor(label, href, type, targetPrefs) {
        this.label = label;
        this.href = href;
        this.type = type;
        this.targetPrefs = targetPrefs;
    }
}
                      
export default class GovServiceNavigation extends LightningElement {

    @api navigationMenuDevName = "Default_Navigation";
    @api serviceName = 'Service Name';
    @api serviceURL = '#';
    @track menuItems;
    @track pageTarget;
    communityBasePath = sitePath;
    showButton = false;
    openList = false;
    showList = false;
    
    connectedCallback() {
        this.handleResize = this.handleResize.bind(this);
        this.getPageTarget(); 
        this.callMenuItems();
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.handleResize);
    }

    getPageTarget() {
        const path = window.location.pathname;
        this.pageTarget = path.replace(this.communityBasePath, '');
    }

    callMenuItems() {
        getDefaultMenuItems({
            strNavigationMenuDevName: this.navigationMenuDevName
        }).then((menuItems) => {
            this.menuItems = menuItems.map((menuItem) => {
                const isSelected = this.normaliseTarget(this.pageTarget) === this.normaliseTarget(menuItem.Target);
                return new NavigationItem(menuItem, isSelected, this.communityBasePath); 
            })

        }).catch((err => {
            console.error(`Could not load menu items due to ${err.message}`)
        }))
    }

    handleNavigate(event) {
        const clickedTarget = new ClickedTarget(
            event.currentTarget.dataset.label,
            event.currentTarget.dataset.target, 
            event.currentTarget.dataset.type, 
            event.currentTarget.dataset.pref
        )
            this.menuItems = this.menuItems.map(item => {
                return {
                ...item,
                selected: item.href === clickedTarget.href && item.label === clickedTarget.label,
                class: item.href === clickedTarget.href && item.label === clickedTarget.label ? 'govuk-service-navigation__item govuk-service-navigation__item--active' : 'govuk-service-navigation__item'
                };
            });  
    }

    normaliseTarget(value) {
        return value ?.replace(this.communityBasePath, '') ?.replace(/^\/+/, '') ?.replace(/\/$/, '')
    }

    handleResize() {
        this.showButton = window.innerWidth < 640;
        this.showList = window.innerWidth >= 640;
    }

    handleButtonExpand() {
        this.openList = !this.openList;
        if(this.openList) {
            this.showList = true;
        } else {
            this.showList = false;
        }
    }

}