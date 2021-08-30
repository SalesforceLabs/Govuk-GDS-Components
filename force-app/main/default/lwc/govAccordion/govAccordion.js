/**
 * Component Name: Gov UK Accordion
 * Version: X.X.XX
 * Created by: Harshpreet Singh Chhabra
 **/
import { LightningElement,api, track } from 'lwc';

export default class GovAccordion extends LightningElement {

    @api sectionLabels = '';
    @api sectionLabelSummarys = '';
    @api sectionContents = '';

    @track sectionArray = [];

    connectedCallback(){

        let sectionLabelist = this.sectionLabels ? this.sectionLabels.split(';') : [];
        let sectionLabelSummaryList = this.sectionLabelSummarys ? this.sectionLabelSummarys.split(';') : [];
        let sectionContentList = this.sectionContents ? this.sectionContents.split('|') : [];

        let sectionObj = {
            secId : '',
            secContentId : '',
            secLabel :'',
            secSummary : '',
            secContent : ''
            };

        for(let i=0; i<sectionLabelist.length;i++){
            sectionObj.secId = 'Section' + i;
            sectionObj.secContentId = 'ContentSection' + i ;
            sectionObj.secLabel = sectionLabelist[i];
            sectionObj.secSummary = sectionLabelSummaryList[i];
            sectionObj.secContent = sectionContentList[i];
            this.sectionArray.push(sectionObj);
            sectionObj = {
                secId : '',
                secContentId : '',
                secLabel :'',
                secSummary : '',
                secContent : ''
                };
        }
        console.log(this.sectionArray);
    }

    handleclick(event){
        let targetId = event.target.dataset.id;
        console.log('Button Id', targetId);
        let target = this.template.querySelector(`[data-id="Content${targetId}"]`);
        if(target.classList.value.includes("govuk-accordion__section--expanded")){
            target.classList.remove('govuk-accordion__section--expanded');
        }else{
            target.classList.add('govuk-accordion__section--expanded');
        }
        console.log(target.classList);
    }
}