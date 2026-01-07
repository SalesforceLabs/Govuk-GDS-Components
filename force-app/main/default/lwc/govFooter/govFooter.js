/**
 * Component Name: Gov UK Footer Rebrand
 **/
import { LightningElement, track, api } from 'lwc';

class MetaLinkItem {
    id;
    metaLinkName;
    metaLinkURL;
    constructor(metaLinkName, metaLinkURL) {
        this.id = generateId('section');
        this.metaLinkName = metaLinkName;
        this.metaLinkURL = metaLinkURL;
    }
}

class FooterItem {
    id;
    sectionName;
    sectionType;
    class;
    listClass;
    relatedNavItems = [];
    constructor(sectionName, sectionType, relatedNavItems) {
        this.id = generateId('section');
        this.sectionName = sectionName;
        this.sectionType = sectionType;
        this.class = sectionType == 2 ? 'govuk-footer__section govuk-grid-column-two-thirds' : 'govuk-footer__section govuk-grid-column-one-third';
        this.listClass = sectionType == 2 ? 'govuk-footer__list govuk-footer__list--columns-2' : 'govuk-footer__list' ;
        this.relatedNavItems = relatedNavItems;
    }
}

function generateId(prefix = 'id') {
    return `${prefix}-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
}

export default class GovFooter extends LightningElement {
    // Secondary Navigation Input variables
    @api secondaryNavigationRequired = false;
    @api sectionNames = "";
    @api navigationNames = "";
    @api navigationLinks = "";
    @api columnTypes = "";

    // Links with Meta Information Input variables
    @api metalinkNames = "";
    @api metalinkURL = "";
    @api metalinksRequired = false;

    //Crest Copyright Logo input variables
    @api crownLogoRequired = false;

    // fields to show consolidated data on UI
    @track finalNavData = []; 
    @track finalMetaLinkData = [];
    @track isMetalinksPresent = false;
    @track finalNavData = [];


    connectedCallback(){

        this.handleSecondaryNavigation();
        this.handleMetaLinks();
    }

    handleSecondaryNavigation() {

        let sectionNamesList = this.handleSemicolonSplit(this.sectionNames);
        let navigationNamesList = this.handleSemicolonSplit(this.navigationNames);
        let navigationLinksList = this.handleSemicolonSplit(this.navigationLinks);
        let columnTypeList = this.handleSemicolonSplit(this.columnTypes);
        
        this.finalNavData = sectionNamesList.map((sectionName, i) => {
            const sectionType = Number(columnTypeList[i]);
            const relatedNavItems = this.buildRelatedNavItems(
                navigationNamesList[i],
                navigationLinksList[i]
            )

            return new FooterItem(sectionName, sectionType, relatedNavItems);
        })
        
    }

    buildRelatedNavItems(names = '', links = '') {
        if (!names || !links) {
            return [];
        }

        let finalList = [];

        const nameList = names.includes('|') ? names.split('|') : [names];
        const linkList = links.includes('|') ? links.split('|') : [links];

        return finalList = this.handleMetaLinkItems(nameList, linkList);
    }

    handleMetaLinks() {
        let metalinkNameList = this.handleSemicolonSplit(this.metalinkNames);
        let metalinkURLList = this.handleSemicolonSplit(this.metalinkURL);
        this.finalMetaLinkData = this.handleMetaLinkItems(metalinkNameList, metalinkURLList);
    }

    handleSemicolonSplit(string) {
        return string ? string.split(';') : [];
    }

    handleMetaLinkItems(metaNames, metaLinks) {
        return metaNames.map((metaName, i) => new MetaLinkItem(metaName, metaLinks[i])); 
    }
}