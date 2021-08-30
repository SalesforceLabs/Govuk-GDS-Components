/**
 * Component Name: Gov UK Start Button
 * Version: X.X.XX
 * Created by: Neetesh Jain
 **/
import {LightningElement, api} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class GovStartButton extends NavigationMixin(LightningElement) {
    @api label;
    @api link;

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