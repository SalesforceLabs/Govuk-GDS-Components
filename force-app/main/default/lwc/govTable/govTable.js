/**
 * Component Name: Gov UK Table
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Neetesh Jain/Brenda Campbell
 **/
import { LightningElement, api, track } from 'lwc';

export default class GovTable extends LightningElement {
    
    @api captionText = '';
    @api captionTextFontSize = '';
    @api columnHeaders = '';
    @api columnTypes = '';
    @api columnWeights = '';
    @api columnSizes = '';
    @api columnData = '';

    @track columns = [];
    @track rows = [];

    get captionClass() {
        let captionClass = "govuk-table__caption"; // <!-- "govuk-table__caption govuk-table__caption--l" -->
        if(this.captionTextFontSize) {
            switch(this.captionTextFontSize.toLowerCase()) {
                case "small":
                    captionClass = captionClass + " govuk-table__caption--s";
                    break;
                case "medium":
                    captionClass = captionClass + " govuk-table__caption--m";
                    break;
                case "large":
                    captionClass = captionClass + " govuk-table__caption--l";
                    break;
                case "xtra-large":
                    captionClass = captionClass + " govuk-table__caption--l";
                    break;
                default:
                    captionClass = captionClass + " govuk-table__caption--l";
            }
        }
        return captionClass;
    }

    connectedCallback() {
        try {
            // get the column headings
            let colHeaders = this.columnHeaders.split(",");

            // get the column types
            let colTypes = this.columnTypes.split(",");

            // get the column weights
            let colWeights = this.columnWeights.split(",");

            // get the column sizes
            let colSizes = this.columnSizes.split(",");

            // create the column headings
            this.columns = [];
            for (let i = 0; i < colHeaders.length; i++) {
                let colStyle = (colSizes[i] !== undefined && ! isNaN(colSizes[i])) ? `width: ${colSizes[i]}%`: "";
                let colClass = (colTypes[i] !== undefined && colTypes[i].toLowerCase() === "numeric") ? "govuk-table__header govuk-table__header--numeric" : "govuk-table__header";
                colClass = (colStyle === "" && colSizes[i] !== undefined) ? colClass + ` govuk-input--width-${colSizes[i]}` : colClass;
                this.columns.push({
                    colHeader: colHeaders[i],
                    colstyle: colStyle,
                    colClass: colClass
                });
            }

            let rowsData = [];
            let colsData = this.columnData.split(";");
            for (let i = 0; i < colsData.length; i++) {
                let row = [];
                let colData = colsData[i].split("|");
                for (let j = 0; j < colData.length; j++) {
                    let rowClass = (colWeights[j] !== undefined && colWeights[j].toLowerCase() === "bold") ? "govuk-table__header" : "govuk-table__cell";
                    rowClass = (colTypes[j] !== undefined && colTypes[j].toLowerCase() === "numeric") ? rowClass + " govuk-table__cell--numeric" : rowClass;
                    row.push({
                        text: colData[j],
                        hasData: (colData[j] !== undefined && colData[j] !== '') ? true : false,
                        rowClass: rowClass
                    });
                }
                rowsData.push({
                    rowData: row
                });
            }
            this.rows = rowsData;

        } catch (err) {
            console.error(err);
        }
    }

}