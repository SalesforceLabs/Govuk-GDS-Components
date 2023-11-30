/**
 * Component Name: Gov UK File Upload
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Neetesh Jain/Brenda Campbell
 **/
import { LightningElement, wire, api, track } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import saveFiles from '@salesforce/apex/FileUploadController.saveFiles';
import { MessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import REGISTER_MC from '@salesforce/messageChannel/registrationMessage__c';
import VALIDATION_MC from '@salesforce/messageChannel/validateMessage__c';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';
import SET_FOCUS_MC from '@salesforce/messageChannel/setFocusMessage__c';

export default class GovFileUpload extends LightningElement {
    
    @api fieldId = "uploadField";
    @api inputFieldId = "file-upload"
    @api fileUploadLabel = "Upload a file";
    @api acceptedFormats = "image/png, image/jpg, .pdf, .doc, .docx, .zip";
    @api maxFileSizeInMB = 2;
    @api required = false;
    @api errorMessage = "Select a file"; 

    @api filesUploadedCollection = []; 
    @api filesUploadedExpanded = []; 
    @api filesUploaded; 

    @api useApexToSaveFile = false;   
    @api recordId = "";
    
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
        this.clearError();
        let files = event.target.files;
        if(files.length > 0) {
            let filesName = '';
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                filesName = filesName + file.name + ',';
                if(file.size > (this.maxFileSizeInMB * 1000000)) {
                    this.hasErrors = true;
                    this.errorMessage = `The selected file(s) must be smaller than ${this.maxFileSizeInMB} MB`;
                    return;
                }
                let freader = new FileReader();
                freader.onload = f => {
                    let base64 = 'base64,';
                    let content = freader.result.indexOf(base64) + base64.length;
                    let fileContents = freader.result.substring(content);
                    if (fileContents === ''  || fileContents === undefined) {
                        this.hasErrors = true;
                        this.errorMessage = `The selected file is empty`;
                        return;
                    }
                    if (i==0) {
                        this.filesUploaded = file.name;
                    } else {
                        this.filesUploaded = this.filesUploaded + ';' + file.name;
                    }
                    this.filesUploadedCollection.push(file.name);
                    this.filesUploadedExpanded.push({
                        Title: file.name,
                        VersionData: fileContents
                    });
                    this.useApexToSaveFile = true;
                    if(this.recordId !== "" && this.useApexToSaveFile && (i+1) === files.length) {
                        this.handleSaveFiles();
                    } 
                    if((i+1) === files.length) {
                        this.dispatchUploadEvent();
                    }  
                };
                freader.readAsDataURL(file);
            }
            this.fileNames = filesName.slice(0, -1);
        }
    }

    handleSaveFiles() {
        saveFiles({
            filesToInsert: this.filesUploadedExpanded,
            strRecId: this.recordId
         })
        .then(data => {
        })
        .catch(error => {
            console.log(`Error while attempting to save file: ` + error);
            this.hasErrors = true;
            this.errorMessage = error;
        }); 
    }

    // messaging attributes
    @wire(MessageContext) messageContext;
    validateSubscription;
    setFocusSubscription;

    // LMS functions
    subscribeMCs() {
        if (this.validateSubscription) {
            return;
        }
        this.validateSubscription = subscribe (
            this.messageContext,
            VALIDATION_MC, (message) => {
                this.handleValidateMessage(message);
            });

        // Receive focus request with message.componentId
        this.setFocusSubscription = subscribe (
            this.messageContext,
            SET_FOCUS_MC, (message) => {
                this.handleSetFocusMessage(message);
            }
        )
    }

    unsubscribeMCs() {
        unsubscribe(this.validateSubscription);
        this.validateSubscription = null;
        unsubscribe(this.setFocusSubscription);
        this.setFocusSubscription = null;
    }

    connectedCallback() {
        // subscribe to the message channels
        this.subscribeMCs();

        // publish the registration message after 0.1 sec to give other components time to initialise
        setTimeout(() => {
            publish(this.messageContext, REGISTER_MC, { componentId: this.fieldId });
        }, 100);
    }

    renderedCallback() {
        // getting ID of component's field
        this.inputFieldId = this.template.querySelector('input').getAttribute('id'); 
        
        // inserting hint text and rendering its HTML
        // const htmlElement = this.template.querySelector(".html-element");
        // if(htmlElement) {
        //     htmlElement.innerHTML = this.hintText;
        //     this.initialised = true;
        // }
    }

    handleSetFocusMessage(message){
        // filter message to check if our component (id) needs to set focus
        let myComponentId = message.componentId;
        console.log('myComponentId: ' + myComponentId);
        console.log('this.inputFieldId: ' + this.inputFieldId);
        
        if(myComponentId == this.inputFieldId){
        
            let myComponent = this.template.querySelector('input');
            myComponent.focus();
        }
    }

    disconnectedCallback() {
        this.unsubscribeMCs();
    }

    handleValidateMessage(message) {
        this.handleValidate();
    }

    @api 
    handleValidate() {
        this.hasErrors = false;
        if(this.required && this.filesUploadedExpanded.length === 0) {
            this.hasErrors = true;
        }
        publish(this.messageContext, VALIDATION_STATE_MC, {
            componentId: this.fieldId,
            isValid: !this.hasErrors,
            error: this.errorMessage,
            focusId: this.inputFieldId
        });
        return !this.hasErrors;
    }

    @api 
    clearError() {
        this.hasErrors = false;
        this.errorMessage = '';
    }

    dispatchUploadEvent() {
        // tell the flow engine about the upload
        const attributeChangeEvent = new FlowAttributeChangeEvent('value', JSON.stringify(this.filesUploaded));
        this.dispatchEvent(attributeChangeEvent);

        // tell any parent components about the upload
        const fileUploadEvent = new CustomEvent('fileUpload', {
            detail: {
                id: this.fieldId,
                value: JSON.stringify(this.filesUploaded)
            }
        });
        this.dispatchEvent(fileUploadEvent);
    }

}