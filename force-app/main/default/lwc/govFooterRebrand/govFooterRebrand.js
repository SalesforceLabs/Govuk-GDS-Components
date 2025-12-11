/**
 * Component Name: Gov UK Footer Rebrand
 **/
import { LightningElement, track, api } from 'lwc';

class MetaLinkItem {
    metaLinkName;
    metaLinkURL;
    constructor(metaLinkName, metaLinkURL) {
        this.metaLinkName = metaLinkName;
        this.metaLinkURL = metaLinkURL;
    }
}

export default class GovFooterRebrand extends LightningElement {
    // Secondary Navigation Input variables
    @api secondaryNavigationRequired = false;
    @api singleColumnHeader = "";
    @api doubleColumnHeader = "";
    @api singleColumnURLs = "";
    @api singleColumnNames ="";
    @api doubleColumnURLs = "";
    @api doubleColumnNames = "";

    // Links with Meta Information Input variables
    @api metalinkNames = "";
    @api metalinkURLs = "";
    @api metalinksRequired = false;
    @api visuallyHiddenLinksText = '';

    //Crest Copyright Logo input variables
    @api crestRequired = false;

    //Custom text and links for foote
    @api footerCustomText = "";
    @api footerCustomLink = "";
    @api footerCustomLinkText = "";

    // fields to show consolidated data on UI
    @track finalNavData = []; 
    @track finalMetaLinkData = [];
    @track isMetalinksPresent = false;
    @track isNavLLinksPresent = false;
    @track finalSingleColumnItems = [];
    @track finalDoubleColumnItems = [];


    connectedCallback(){

        this.handleColumnItems();
        this.handleMetaLinks();

    }

    handleColumnItems() {
        let singleColumnNameList = this.handleSemicolonSplit(this.singleColumnNames);
        let singleColumnURLList = this.handleSemicolonSplit(this.singleColumnURLs);
        let doubleColumnNameList = this.handleSemicolonSplit(this.doubleColumnNames);
        let doubleColumnURLList = this.handleSemicolonSplit(this.doubleColumnURLs);

        this.finalSingleColumnItems = this.handleMetaLinkItems(singleColumnNameList, singleColumnURLList);
        this.finalDoubleColumnItems = this.handleMetaLinkItems(doubleColumnNameList, doubleColumnURLList);

    }

    handleMetaLinks() {
        let metalinkNameList = this.handleSemicolonSplit(this.metalinkNames);
        let metalinkURLList = this.handleSemicolonSplit(this.metalinkURLs);
        this.finalMetaLinkData = this.handleMetaLinkItems(metalinkNameList, metalinkURLList);
    }

    handleSemicolonSplit(string) {
        return string ? string.split(';') : [];
    }

    handleMetaLinkItems(metaNames, metaLinks) {
        return metaNames.map((metaName, i) => new MetaLinkItem(metaName, metaLinks[i])); 
    }
}