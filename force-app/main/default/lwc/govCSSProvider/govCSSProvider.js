/**
 * Component Name: Gov UK CSS Provider
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Neetesh Jain/Harshpreet Singh Chhabra
 **/
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
        .then(() => console.log('CSS File loaded.'))
        .catch(error => console.log("Error " + error.body.message));
    }

}