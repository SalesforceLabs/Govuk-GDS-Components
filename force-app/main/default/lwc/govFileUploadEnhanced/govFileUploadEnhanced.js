import { LightningElement, track, api, wire} from 'lwc';
import uploadUiOverride from '@salesforce/resourceUrl/uploadUiOverride';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle } from 'lightning/platformResourceLoader';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import { MessageContext, publish, subscribe, unsubscribe } from 'lightning/messageService';
import getKey from '@salesforce/apex/FileUploadAdvancedHelper.getKey';
import encrypt from '@salesforce/apex/FileUploadAdvancedHelper.encrypt';
import createContentVers from '@salesforce/apex/FileUploadAdvancedHelper.createContentVers';
import appendDataToContentVersion from '@salesforce/apex/FileUploadAdvancedHelper.appendDataToContentVersion';
import createContentDocLink from '@salesforce/apex/FileUploadAdvancedHelper.createContentDocLink';
import deleteContentDoc from '@salesforce/apex/FileUploadAdvancedHelper.deleteContentDoc';
import getExistingFiles from '@salesforce/apex/FileUploadAdvancedHelper.getExistingFiles';
import updateFileName from '@salesforce/apex/FileUploadAdvancedHelper.updateFileName';

//labels
import uxgRemoveFileConfirmation from "@salesforce/label/c.uxg_Remove_File_Confirmation";

//message channels
import REGISTER_MC from '@salesforce/messageChannel/registrationMessage__c';
import VALIDATION_MC from '@salesforce/messageChannel/validateMessage__c';
import VALIDATION_STATE_MC from '@salesforce/messageChannel/validationStateMessage__c';
import SET_FOCUS_MC from '@salesforce/messageChannel/setFocusMessage__c';

export default class GovFileUploadEnhanced extends LightningElement {

    @api inputFieldId = "input-file"
    @track hasErrors        = false;
    @track displayFileList  = false; 
    @track docIds           = [];
    @track fileNames        = [];
    @track objFiles         = [];
    @track versIds          = [];
    @api errorMessage       = '';
    @api label;
    @api acceptedFormats;
    @api allowMultiple;
    @api overriddenFileName;    
    @api uploadedlabel;
    @api required;
    @api requiredMessage;
    @api sessionKey;
    @api uniqueFieldId = 'fileUploadEnhancedField';
    @api uploadedFileNames;
    @api contentDocumentIds;
    @api contentVersionIds;
    @api recordId;
    numberOfFilesToUpload = 0;
    loading = false;
    disabled = false;

    //accessibility text
    message = '';

    @api filesUploadedCollection = []; 
    @api filesUploaded; 

    // messaging attributes
    @wire(MessageContext) messageContext;
    validateSubscription;
    setFocusSubscription;


    key;
    @wire(getKey)
    wiredKey({error,data}){
        if(data){
            this.key = data;
        }
        else if (error){
            this.showErrors(this.reduceErrors(error).toString());
        }
    }

    value;
    @wire(encrypt,{recordId: '$recordId', encodedKey: '$key'})
    wiredValue({error,data}){
        if(data){
            this.value = data;
        }
        else if (error){
            this.showErrors(this.reduceErrors(error).toString());
        }
    }

    get formGroupClass() {
        let groupClass = "govuk-form-group ";
        groupClass = (this.hasErrors) ? groupClass + " govuk-form-group--error" : groupClass;
        return groupClass;
    }

    renderedCallback() {


        this.displayExistingFiles();
       
        if(this.isCssLoaded) return
        this.isCssLoaded = true;
        
        loadStyle(this,uploadUiOverride).then(()=>{
            
        })
        .catch(error=>{
            this.showErrors(this.reduceErrors(error).toString());
        });
    }


    handleSetFocusMessage(message){
        
        const myComponent = this.template.querySelector('a[name="fileUploaderSummaryTitle"]');
        myComponent.focus();

    }

    connectedCallback(){
        console.log('*** this.recordId: '+ this.recordId);
        let cachedSelection = sessionStorage.getItem(this.uniqueFieldId + '.files'); 
        if(cachedSelection){
            this.processFiles(JSON.parse(cachedSelection));
        } else if(this.recordId && this.renderExistingFiles) {
            getExistingFiles({recordId: this.recordId})
                .then((files) => {
                    if(files != undefined && files.length > 0){
                        console.log('*** files: ' + files);
                        this.processFiles(files);
                    } else {
                        this.communicateEvent(this.docIds,this.versIds,this.fileNames,this.objFiles);
                    }
                })
                .catch((error) => {
                    this.showErrors(this.reduceErrors(error).toString());
                })
        } else {
            this.communicateEvent(this.docIds,this.versIds,this.fileNames,this.objFiles);
            
        }

        this.displayExistingFiles();

        // subscribe to the message channels
        this.subscribeMCs();

        // publish the registration message after 0.1 sec to give other components time to initialise
        setTimeout(() => {
            publish(this.messageContext, REGISTER_MC, {componentId:this.inputFieldId});
        }, 100);
    }

    disconnectedCallback() {
        this.unsubscribeMCs();
    }

    displayExistingFiles(){
        
        if(this.objFiles.length > 0){ // FIX
            this.displayFileList = true;
        } else {
            this.displayFileList = false;
        }
    }

    handleUpload_lightningFile(event){

        let files = event.detail.files;
        this.handleUploadFinished(files);
    }

    handleUploadFinished(files) {
        
        console.log('*** files: '+ files);
        let objFiles = [];
        let versIds = [];

        files.forEach(file => {
            console.log('*** file.documentId' + file.documentId);
            console.log('*** file.contentVersionId' + file.contentVersionId);
            

            let name;
            if(this.overriddenFileName){
                name = this.overriddenFileName.substring(0,255) +'.'+ file.name.split('.').pop();
            } else {
                name = file.name;
            }
            
            let objFile = {
                name: name,
                documentId: file.documentId,
                contentVersionId: file.contentVersionId,
                removeFileAriaLabel: ' file ' + name
            }

            console.log('*** objFile.removeFileAriaLabel: ' + objFile.removeFileAriaLabel);

            objFiles.push(objFile);

            versIds.push(file.contentVersionId);

        })

        if(this.overriddenFileName){
            updateFileName({versIds: versIds, fileName: this.overriddenFileName.substring(0,255)})
                .catch(error => {
                    this.showErrors(this.reduceErrors(error).toString());
                });
        }

        console.log('*** about to call createContentDocLink({versIds:'+ versIds +', encodedKey:'+ this.key + ', visibleToAllUsers:'+  this.visibleToAllUsers+'})');
        if(this.recordId){
            createContentDocLink({versIds: versIds, encodedKey: this.key, visibleToAllUsers: this.visibleToAllUsers})
            .then(result => {
                console.log('*** createContentDocLink completed: '+ result);
            })
            .catch(error => {
                    this.showErrors(this.reduceErrors(error).toString());
            });
        }

        this.processFiles(objFiles);

        this.displayExistingFiles();
    }

    processFiles(files){
        
        

        files.forEach(file => {

            console.log('file.name: '+ file.name);
            console.log('file.documentId: '+ file.documentId);
            console.log('file.contentVersionId: '+ file.contentVersionId);
            console.log('file.versionId: '+ file.versionId);
            

            let filetype;
            if(this.icon == null){
                filetype = getIconSpecs(file.name.split('.').pop());
            }
            else{
                filetype = this.icon;
            }
            let objFile = {
                name: file.name,
                filetype: filetype,
                documentId: file.documentId,
                contentVersionId: file.contentVersionId,
                removeFileAriaLabel: ' file ' + file.name
            };
            this.objFiles.push(objFile);
            this.docIds.push(file.documentId);
            this.versIds.push(file.contentVersionId);
            this.fileNames.push(file.name);
        });

        this.checkDisabled();

        this.communicateEvent(this.docIds,this.versIds,this.fileNames,this.objFiles);

        function getIconSpecs(docType){
            switch(docType){
                case 'csv':
                    return 'doctype:csv';
                case 'pdf':
                    return 'doctype:pdf';
                case 'pps':
                case 'ppt':
                case 'pptx':
                    return 'doctype:ppt';
                case 'xls':
                case 'xlsx':
                    return 'doctype:excel';
                case 'doc':
                case 'docx':
                    return 'doctype:word';
                case 'txt':
                    return 'doctype:txt';
                case 'png':
                case 'jpeg':
                case 'jpg':
                case 'gif':
                    return 'doctype:image';
                default:
                    return 'doctype:unknown';
            }
        }
    }

    deleteDocument(event){
        this.loading = true;
        event.target.blur();

        let contentVersionId = event.target.dataset.contentversionid;    

        if(this.disableDelete){
            this.removeFileFromUi(contentVersionId);
        } else {
            deleteContentDoc({versId: contentVersionId})
            .then(() => {
                this.removeFileFromUi(contentVersionId);
            })
            .catch((error) => {
                this.showErrors(this.reduceErrors(error).toString());
                this.loading = false;
            })
        }
        
    }

    reduceErrors(errors) {
        if (!Array.isArray(errors)) {
            errors = [errors];
        }
    
        return (
            errors
                // Remove null/undefined items
                .filter((error) => !!error)
                // Extract an error message
                .map((error) => {
                    // UI API read errors
                    if (Array.isArray(error.body)) {
                        return error.body.map((e) => e.message);
                    }
                    // Page level errors
                    else if (
                        error?.body?.pageErrors &&
                        error.body.pageErrors.length > 0
                    ) {
                        return error.body.pageErrors.map((e) => e.message);
                    }
                    // Field level errors
                    else if (
                        error?.body?.fieldErrors &&
                        Object.keys(error.body.fieldErrors).length > 0
                    ) {
                        const fieldErrors = [];
                        Object.values(error.body.fieldErrors).forEach(
                            (errorArray) => {
                                fieldErrors.push(
                                    ...errorArray.map((e) => e.message)
                                );
                            }
                        );
                        return fieldErrors;
                    }
                    // UI API DML page level errors
                    else if (
                        error?.body?.output?.errors &&
                        error.body.output.errors.length > 0
                    ) {
                        return error.body.output.errors.map((e) => e.message);
                    }
                    // UI API DML field level errors
                    else if (
                        error?.body?.output?.fieldErrors &&
                        Object.keys(error.body.output.fieldErrors).length > 0
                    ) {
                        const fieldErrors = [];
                        Object.values(error.body.output.fieldErrors).forEach(
                            (errorArray) => {
                                fieldErrors.push(
                                    ...errorArray.map((e) => e.message)
                                );
                            }
                        );
                        return fieldErrors;
                    }
                    // UI API DML, Apex and network errors
                    else if (error.body && typeof error.body.message === 'string') {
                        return error.body.message;
                    }
                    // JS errors
                    else if (typeof error.message === 'string') {
                        return error.message;
                    }
                    // Unknown error shape so try HTTP status text
                    return error.statusText;
                })
                // Flatten
                .reduce((prev, curr) => prev.concat(curr), [])
                // Remove empty strings
                .filter((message) => !!message)
        );
    }

    removeFileFromUi(contentVersionId){
        let objFiles = this.objFiles;
        let removeIndex;
        for(let i=0; i<objFiles.length; i++){
            if(contentVersionId === objFiles[i].contentVersionId){
                removeIndex = i;

                this.message = uxgRemoveFileConfirmation.replace('{0}', objFiles[i].name);
            }
        }

        this.objFiles.splice(removeIndex,1);
        this.docIds.splice(removeIndex,1);
        this.versIds.splice(removeIndex,1);
        this.fileNames.splice(removeIndex,1);

        this.checkDisabled();

        this.communicateEvent(this.docIds,this.versIds,this.fileNames,this.objFiles);

        this.loading = false;
    }

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

    handleValidateMessage(message) {
        console.log('handleValidateMessage: ', message);
        console.log('handleValidateMessage compid: ', message.componentId);
        this.handleValidate();
    }

    @api handleValidate() {
        this.hasErrors = false;

        if(this.docIds.length === 0 && this.required === true){ 
            this.hasErrors = true;
        } else {
            this.hasErrors = false;
        }
        console.log('govFileUploadEnhanced: handleValidate');
        console.log('handleValidate: ', this.hasErrors);
        console.log('handleValidate: ', this.errorMessage);
        console.log('handleValidate: ', this.inputFieldId);
        publish(this.messageContext, VALIDATION_STATE_MC, {
            componentId: this.inputFieldId,
            isValid: !this.hasErrors,
            error: this.errorMessage,
            focusId: this.inputFieldId
        });
    }

    @api clearError() {
        this.hasErrors = false;
    }

    checkDisabled(){
        if(!this.allowMultiple && this.objFiles.length >= 1){
            this.disabled = true;
        } else {
            this.disabled = false;
        }
    }

    showErrors(errors){
        if(this.embedExternally){
            this.showAlert(errors);
        } else {
            this.showToast(errors);
        }
    }

    showAlert(errors){
        window.alert(errors);
    }

    showToast(errors){
        let message = new ShowToastEvent({
            title: 'We hit a snag.',
            message: errors,
            variant: 'error',
        });
        this.dispatchEvent(message);
    }

    communicateEvent(docIds, versIds, fileNames, objFiles){
        this.dispatchEvent(new FlowAttributeChangeEvent('contentDocumentIds', [...docIds]));
        this.dispatchEvent(new FlowAttributeChangeEvent('contentVersionIds', [...versIds]));
        this.dispatchEvent(new FlowAttributeChangeEvent('uploadedFileNames', [...fileNames]));

        //update file names output variables
        this.filesUploadedCollection = fileNames;
        this.filesUploaded = fileNames.join(';');

        sessionStorage.setItem(this.uniqueFieldId + '.files', JSON.stringify(objFiles));
    }
}