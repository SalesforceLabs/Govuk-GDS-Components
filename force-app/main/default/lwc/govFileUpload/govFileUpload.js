import { LightningElement, api, track } from 'lwc';
import saveFiles from '@salesforce/apex/FileUploadController.saveFiles';

export default class GovFileUpload extends LightningElement {
    
    @api fileUploadLabel = "Upload a file";
    @api recordId = "0019D00000HYiO8QAL";
    @api errorMessage = "Error";    
    @api fileNames = "";
    @api filesUploaded = []; 

    @track hasErrors = false;

    get formGroupClass() {
        let formGroupClass = "";
        formGroupClass =  this.hasErrors ? "govuk-form-group govuk-form-group--error" : "govuk-form-group";
        return formGroupClass;
    }

    get inputClass() {
        let inputClass = "";
        inputClass =  this.hasErrors ? "govuk-file-upload govuk-file-upload--error" : "govuk-file-upload";
        return inputClass;
    }

    handleFilesChange(event) {
        let files = event.target.files;
        if(files.length > 0) {
            let filesName = '';
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                filesName = filesName + file.name + ',';
                let freader = new FileReader();
                freader.onload = f => {
                    let base64 = 'base64,';
                    let content = freader.result.indexOf(base64) + base64.length;
                    let fileContents = freader.result.substring(content);
                    this.filesUploaded.push({
                        Title: file.name,
                        VersionData: fileContents
                    });
                    if(this.recordId !== "" && (i+1) === files.length) {
                        this.handleSaveFiles();
                    }   
                };
                freader.readAsDataURL(file);
            }
            this.fileNames = filesName.slice(0, -1);
        }
    }

    handleSaveFiles() {
        saveFiles({
            filesToInsert: this.filesUploaded,
            strRecId: this.recordId
         })
        .then(data => {
        })
        .catch(error => {
            
        }); 
    }

}