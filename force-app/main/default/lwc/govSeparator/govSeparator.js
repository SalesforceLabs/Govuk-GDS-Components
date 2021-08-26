import {LightningElement,api} from 'lwc';

export default class GovSeparator extends LightningElement {
    @api size = "small";
    @api isVisible = false;

    get separatorClass() {
        let sizeString = "";
        let visibleString = (this.isVisible) ? "govuk-section-break--visible" : "";

        switch (this.size.toLowerCase()) {
            case 'small':
                sizeString = "govuk-section-break--s";
                break;
            case 'medium':
                sizeString = "govuk-section-break--m";
                break;
            case 'large':
                sizeString = "govuk-section-break--l";
                break;
            case 'xlarge':
                sizeString = "govuk-section-break--xl";
                break;
            default:
                sizeString = "govuk-section-break--m";
        }
        return `govuk-section-break ${sizeString} ${visibleString}`;
    }
}