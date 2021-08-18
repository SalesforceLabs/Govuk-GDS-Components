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
        let captionClass = "govuk-table__caption";
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
                this.columns.push({
                    colHeader: colHeaders[i],
                    class: (colTypes[i] !== undefined && colTypes[i].toLowerCase() === "numeric") ? `govuk-table__header govuk-table__header--numeric govuk-!-width-${colSizes[i]}` : `govuk-table__header govuk-!-width-${colSizes[i]}`
                });
            }

            let rowsData = [];
            let colsData = this.columnData.split(";");
            for (let i = 0; i < colsData.length; i++) {
                let row = [];
                let colData = colsData[i].split("|");
                for (let j = 0; j < colData.length; j++) {
                    row.push({
                        text: colData[j],
                        hasData: (colData[j] !== undefined && colData[j] !== '') ? true : false,
                        isBold: (colWeights[j] !== undefined && colWeights[j].toLowerCase() === "bold") ? true : false
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