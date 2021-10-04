/**
 * Component Name: Gov UK Footer
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Harshpreet Singh Chhabra/Brenda Campbell
 **/
import { LightningElement,track ,api} from 'lwc';

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
    @api crownLogoRequired = false;

    // fields to show consolidated data on UI
    @track finalNavData = []; 
    @track finalMetaLinkData = [];
    @track isMetalinksPresent = false;
    @track isNavLLinksPresent = false;

    connectedCallback(){
        //splitting all comma separated values to form an array
        let sectionNamesList = this.sectionNames ? this.sectionNames.split(';') : [];
        let navigationNamesList = this.navigationNames ? this.navigationNames.split(';') : [];
        let navigationLinksList = this.navigationLinks ? this.navigationLinks.split(';') : [];
        let columnTypeList = this.columnTypes ? this.columnTypes.split(';') : [];
        let metalinkNameList = this.metalinkNames? this.metalinkNames.split(';') : [];
        let metalinkURLList = this.metalinkURL ? this.metalinkURL.split(';') : [];

        // json format to store secondary information for each section
        let jsonData = {
        sectionName : '',
        twoColumnType : true,
        relatedNavItems : []
        };
        let innerObj = {
        navLinkName :'',
        navLinkURL : ''
        };

        //array to store multiple metalinks and URLs
        let metalinkObj = {
        metaLinkName :'',
        metaLinkURL : ''
        }

        // This loop will populate Secondary Navigation data ie for each section , its related nav item names and URLS
        for(let i=0; i<navigationNamesList.length;i++){
            jsonData.sectionName = sectionNamesList[i];
            jsonData.twoColumnType = columnTypeList[i] == 2 ? true : false;
            jsonData.sectionClass = columnTypeList[i] == 2 ? "two-column-section" : "one-column-section";
            if(navigationNamesList[i].includes('|')){
                let navNames = navigationNamesList[i]?navigationNamesList[i].split('|'):[];
                let navLinks = navigationLinksList[i]?navigationLinksList[i].split('|'):[];
                for(let j=0; j<navNames.length;j++){
                    innerObj.navLinkName = navNames[j];
                    innerObj.navLinkURL = navLinks[j];
                    jsonData.relatedNavItems.push(innerObj);
                    innerObj = {
                    navLinkName :'',
                    navLinkURL : ''
                    };
                }
            }else{
                innerObj.navLinkName = navigationNamesList[i];
                innerObj.navLinkURL = navigationLinksList[i];
                jsonData.relatedNavItems.push(innerObj);
                innerObj = {
                    navLinkName :'',
                    navLinkURL : ''
                };
            }
            this.finalNavData.push(jsonData);
            jsonData = {
                sectionName : '',
                twoColumnType : true,
                relatedNavItems : []
            };
        }

        //This loop will save the array of metalinks and URLs to iterate on the UI
        for(let i=0; i<metalinkNameList.length;i++){
            metalinkObj.metaLinkName = metalinkNameList[i];
            metalinkObj.metaLinkURL = metalinkURLList[i];
            this.finalMetaLinkData.push(metalinkObj);
            metalinkObj = {
                metaLinkName :'',
                metaLinkURL : ''
            }
        }

    }

}