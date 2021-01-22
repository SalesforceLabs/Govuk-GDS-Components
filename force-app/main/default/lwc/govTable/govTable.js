import {LightningElement,api,track} from 'lwc';

export default class GovTable extends LightningElement {
    @api caption = "";
    @api hintText = "";
    @api headings = "";
    @api columnWeights = "";
    @api columnSizes = "";
    @api column1Data = "";
    @api column2Data = "";
    @api column3Data = "";
    @api column4Data = "";

    @track columns = [];
    @track rows = [];

    connectedCallback() {
        try {
            // get the column headings and restrict to 4
            let headings = this.headings.split(",");
            if (headings.length > 4) headings = headings.slice(0, 4);

            // get the column sizes and restrict to 4
            let sizes = this.columnSizes.split(",");
            if (sizes.length > 4) sizes = sizes.slice(0, 4);

            // create the column headings
            this.columns = [];
            for (let i = 0; i < headings.length; i++) {
                this.columns.push({
                    heading: headings[i],
                    class: `govuk-table__header govuk-!-width-${sizes[i]}`
                });
            }

            //put the data into a single array
            const column1Data = this.column1Data.split(",");
            const column2Data = this.column2Data.split(",");
            const column3Data = this.column3Data.split(",");
            const column4Data = this.column4Data.split(",");
            const columnWeights = this.columnWeights.split(",");
            let rows = [];
            for (let i = 0; i < column1Data.length; i++) {
                rows.push({
                    column1: {text:column1Data[i], isBold:(columnWeights[0] !== undefined && columnWeights[0].toLowerCase() === 'bold') ? true : false },
                    column2: {text:column2Data[i], isBold:(columnWeights[1] !== undefined && columnWeights[1].toLowerCase() === 'bold') ? true : false },
                    column3: {text:column3Data[i], isBold:(columnWeights[2] !== undefined && columnWeights[2].toLowerCase() === 'bold') ? true : false },
                    column4: {text:column4Data[i], isBold:(columnWeights[3] !== undefined && columnWeights[3].toLowerCase() === 'bold') ? true : false },
                });
            }
            this.rows = rows;
            console.log(`Rows are ${JSON.stringify(this.rows)}`);

        } catch (err) {
            console.error(err);
        }
    }


    get hasColumn1() {
        return (this.columns.length > 0);
    }

    get hasColumn2() {
        return (this.columns.length > 1);
    }

    get hasColumn3() {
        return (this.columns.length > 2);
    }

    get hasColumn4() {
        return (this.columns.length > 3);
    }


}