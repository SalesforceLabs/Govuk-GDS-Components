import { LightningElement } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import govCssStyle from '@salesforce/resourceUrl/govukcss';

let cssStylesLoaded = false;

export default class GovCSSProvider extends LightningElement {

    constructor() {
        super();
        if (cssStylesLoaded === true) {
            return;
        }
        cssStylesLoaded = true;
        loadStyle(this, govCssStyle)
        .then(() => console.log('Files loaded.'))
        .catch(error => console.log("Error " + error.body.message));
    }

}