import { LightningElement, track, api, wire } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getKey from '@salesforce/apex/FileUploadAdvancedHelper.getKey';
import encrypt from '@salesforce/apex/FileUploadAdvancedHelper.encrypt';
import createContentVers from '@salesforce/apex/FileUploadAdvancedHelper.createContentVers';
import appendDataToContentVersion from '@salesforce/apex/FileUploadAdvancedHelper.appendDataToContentVersion';
import createContentDocLink from '@salesforce/apex/FileUploadAdvancedHelper.createContentDocLink';
import deleteContentDoc from '@salesforce/apex/FileUploadAdvancedHelper.deleteContentDoc';
import getExistingFiles from '@salesforce/apex/FileUploadAdvancedHelper.getExistingFiles';
import updateFileName from '@salesforce/apex/FileUploadAdvancedHelper.updateFileName';

import uploadUiOverride from '@salesforce/resourceUrl/uploadUiOverride';
import { loadStyle } from 'lightning/platformResourceLoader';

const MAX_FILE_SIZE = 4500000;
const CHUNK_SIZE = 750000;

// Convert CB values to a boolean
function cbToBool(value) {
    return value === "CB_TRUE";
  }

export default class govFileUploadAdvanced extends NavigationMixin(LightningElement) {
    
    @track hasErrors = false;
    @api errorMessage = '';

    @api acceptedFormats;
    @api
     get allowMultiple() {
    return cbToBool(this.cb_allowMultiple);
    }
    @api cb_allowMultiple;
    @api community; // deprecated
    @api communityDetails; // deprecated
    @api contentDocumentIds;
    @api contentVersionIds;
    @api
    get disableDelete() {
    return cbToBool(this.cb_disableDelete);
    }
    @api cb_disableDelete;
    // @api
    // get embedExternally() {
    // return cbToBool(this.cb_embedExternally);
    // }
    // @api cb_embedExternally;
    @api helpText;
    @api icon;
    @api label;
    @api overriddenFileName;    
    @api recordId;
    @api
    get renderExistingFiles() {
    return cbToBool(this.cb_renderExistingFiles);
    }
    @api cb_renderExistingFiles;
    @api
    get renderFilesBelow() {
    return cbToBool(this.cb_renderFilesBelow);
    }
    @api cb_renderFilesBelow;
    @api
    get required() {
    return cbToBool(this.cb_required);
    }
    @api cb_required;
    @api requiredMessage;
    @api sessionKey;
    @api uploadedFileNames;
    @api uploadedlabel;
    @api uploadedLabel; // deprecated
    @api
    get visibleToAllUsers() {
    return cbToBool(this.cb_visibleToAllUsers);
    }
    @api cb_visibleToAllUsers;
    
    @track docIds =[];
    @track fileNames = [];
    @track objFiles = [];
    @track versIds = [];

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

    get bottom(){
        if(this.renderFilesBelow){
            return true;
        }
        else{
            return false;
        }
    }

    get external(){
        // OVERRIDE
        return false;
        // if(this.embedExternally){
        //     return true;
        // }
        // else{
        //     return false;
        // }
    }

    get divBorderDebug(){
        return 'border:1px solid #ccc!important; margin-bottom:10px;'
    }

    @track displayFileList = false;
    isCssLoaded = false;

    displayExistingFiles(){
        // console.log('this.renderExistingFiles: ' + this.renderExistingFiles);
        // console.log('this.objFiles: ' + this.objFiles);
        // console.log('this.objFiles.length: ' + this.objFiles.length);
        
        

        if(this.objFiles.length > 0){ // FIX
            this.displayFileList = true;
            // console.log(' this.objFiles.length this.displayFileList: ' + this.displayFileList);
        } else {
            this.displayFileList = false;
        }
    }

    renderedCallback() {

this.displayExistingFiles();
       
        // loading uploadUiOverride
        // Promise.all([
        //     loadStyle(this, uploadUiOverride)
        // ])


        if(this.isCssLoaded) return
        this.isCssLoaded = true;
        loadStyle(this,uploadUiOverride).then(()=>{
            // console.log('loaded');
        })
        .catch(error=>{
            // console.log('error to load');
        });

       

    }
    connectedCallback(){


        
        let cachedSelection = sessionStorage.getItem(this.sessionKey);
        if(cachedSelection){
            this.processFiles(JSON.parse(cachedSelection));
        } else if(this.recordId && this.renderExistingFiles) {
            getExistingFiles({recordId: this.recordId})
                .then((files) => {
                    if(files != undefined && files.length > 0){
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
            // console.log('this.objFiles.length: ' + this.objFiles.length);
            
        }

        this.displayExistingFiles();
    }

    numberOfFilesToUpload = 0;
    loading = false;
    handleUpload_lightningInput(event){
        // console.log('inside lightningInput');
        let files = event.target.files;

        let fileNames = [];
        let filesToProcess = [];
        for(let i = 0; i < files.length; i++){
            let file = files[i];

            if (file.size > MAX_FILE_SIZE) {
                let maxFileSize = formatBytes(MAX_FILE_SIZE,2);
                let fileSize = formatBytes(file.size, 2);
                this.showErrors('File size cannot exceed ' + maxFileSize + '. ' + file.name + ' is ' + fileSize + '.');
                continue;
            }
            // console.log('about to push filenames to array:' + file.name);
            fileNames.push(file.name);
            // console.log('about to push filenames');
            filesToProcess.push(file);
            // console.log('After push filenames');
        }

        this.numberOfFilesToUpload = fileNames.length;

        if(this.numberOfFilesToUpload != 0){
            this.loading = true;
            // console.log('about to got o createContentVers');
            createContentVers({fileNames: fileNames, encodedRecordId: this.value})
                .then(objFiles => {
                    this.handleUploadFinished(objFiles);
                    // console.log('created file ver .then');
                    for (let i = 0; i < filesToProcess.length; i++) {
                        let file = filesToProcess[i];
                        let versId = objFiles[i].contentVersionId;
                        // console.log('about to processFile');
                        processFile(file,versId);
                    }

                })
                .catch(error => {
                    // console.log('created file error' + error);
                    this.showErrors(this.reduceErrors(error).toString());
                    this.loading = false;
                })
        }

        let self = this;
        async function processFile(file,versId) {
            try {
                let fileContents = await readFileAsync(file);
                // console.log('async about to processFile self.upload');
                self.upload(fileContents, versId);
            } catch(error) {
                // console.log('fileupload err'+error);
                self.showErrors(error.toString());
            }
        }

        function readFileAsync(file) {
            return new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.readAsDataURL(file);
            
                reader.onload = () => {
                    resolve(reader.result.split(',').pop());
                };
            
                reader.onerror = reject;
            
            })
        }

        function formatBytes(bytes,decimals) {
            if(bytes == 0) return '0 Bytes';
            let k = 1024,
                dm = decimals || 2,
                sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
                i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }
    } // end handleUpload_lightningInput

    upload(fileContents, versId){
        // console.log('self.upload');
        let fromPosition = 0;
        let toPosition = Math.min(fileContents.length, fromPosition + CHUNK_SIZE);
        // console.log('about to upload chunk');
        this.uploadChunk(fileContents, versId, fromPosition, toPosition);
    }

    numberOfFilesUploaded = 0;
    uploadChunk(fileContents, versId, fromPosition, toPosition){
        // console.log('in upload chunk');
        let chunk = fileContents.substring(fromPosition,toPosition);
        // console.log('about to appendDataToContentVersion');
        appendDataToContentVersion({ versionId: versId, base64Data: chunk})
            .then(() => {
                // console.log('back from appendDataToContentVersion .then');
                fromPosition = toPosition;
                toPosition = Math.min(fileContents.length, fromPosition + CHUNK_SIZE);
                if(fromPosition < toPosition){
                    // console.log('about to kick off uploadChunk again .then');
                    this.uploadChunk(fileContents, versId, fromPosition, toPosition);
                } else {
                    this.numberOfFilesUploaded += 1;

                    if(this.numberOfFilesUploaded == this.numberOfFilesToUpload){
                        this.numberOfFilesUploaded = 0;
                        this.loading = false;
                    }
                }
            })
            .catch(error => {
                // console.log('.then err from appendDataToContentVersion' + error);
                // .then err from appendDataToContentVersion
                this.showErrors(this.reduceErrors(error).toString());
                this.numberOfFilesUploaded = 0;
                this.loading = false;
            })
    }

   
    handleUpload_lightningFile(event){
        // console.log('handleUpload_lightningFile');
        let files = event.detail.files;
        // console.log('handleUpload_lightningFile files: ' + files.length);
        this.handleUploadFinished(files);
    }
    
    handleUploadFinished(files) {
        // console.log('Inside handleUploadFinished');
        let objFiles = [];
        let versIds = [];


        files.forEach(file => {
            // if(file.contentVersionId){
            //      console.log('file.contentVersionId:' + file.contentVersionId);
            // } else {
            //      console.log('NOT AVAILABLE file.contentVersionId:');   
            // }

            // console.log('file.documentId:' + file.documentId);
            // console.log('file.name:' + file.name);
            let name;
            if(this.overriddenFileName){
                name = this.overriddenFileName.substring(0,255) +'.'+ file.name.split('.').pop();
            } else {
                name = file.name;
            }
            
            let objFile = {
                name: name,
                documentId: file.documentId,
                contentVersionId: file.contentVersionId
            }
            objFiles.push(objFile);

            versIds.push(file.contentVersionId);

            // var reader = new FileReader();
            // reader.onload = function(event) {
            // var dataURL = event.target.result;
            // var mimeType = dataURL.split(",")[0].split(":")[1].split(";")[0];
            // alert(mimeType);
            // };
            // reader.readAsDataURL(objFile);
        })
        // console.log('objFiles:' + objFiles + ' count:' + objFiles.length);
        // console.log('versIds:' + versIds + ' count:' + versIds.length);

        if(this.overriddenFileName){
            updateFileName({versIds: versIds, fileName: this.overriddenFileName.substring(0,255)})
                .catch(error => {
                    // console.log('Err overrideFileName' + error);
                    this.showErrors(this.reduceErrors(error).toString());
                });
        }
        // console.log('this.recordId:'+this.recordId);
        if(this.recordId){
            // console.log('============================');
            // console.log('versIds:'+versIds);
            // console.log('this.key:'+this.key);
            // console.log('this.visibleToAllUsers:'+this.visibleToAllUsers);
            // console.log('============================');
            createContentDocLink({versIds: versIds, encodedKey: this.key, visibleToAllUsers: this.visibleToAllUsers})
                .catch(error => {
                    this.showErrors(this.reduceErrors(error).toString());
                });
        }

        this.processFiles(objFiles);

        this.displayExistingFiles();
    }

    processFiles(files){
        
        files.forEach(file => {
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
                contentVersionId: file.contentVersionId
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

    removeFileFromUi(contentVersionId){
        let objFiles = this.objFiles;
        let removeIndex;
        for(let i=0; i<objFiles.length; i++){
            if(contentVersionId === objFiles[i].contentVersionId){
                removeIndex = i;
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

    disabled = false;
    checkDisabled(){
        if(!this.allowMultiple && this.objFiles.length >= 1){
            this.disabled = true;
        } else {
            this.disabled = false;
        }
    }

    communicateEvent(docIds, versIds, fileNames, objFiles){
        this.dispatchEvent(new FlowAttributeChangeEvent('contentDocumentIds', [...docIds]));
        this.dispatchEvent(new FlowAttributeChangeEvent('contentVersionIds', [...versIds]));
        this.dispatchEvent(new FlowAttributeChangeEvent('uploadedFileNames', [...fileNames]));

        sessionStorage.setItem(this.sessionKey, JSON.stringify(objFiles));
    }

    openFile(event) {
        let docId = event.target.dataset.docid;
        event.preventDefault();
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state: {
                recordIds: docId
            }
        });
    }

    @api
    validate(){
        if(this.docIds.length === 0 && this.required === true){ 
            let errorMessage;
            if(this.requiredMessage == null){
                errorMessage = 'Upload at least one file.';
            }
            else{
                errorMessage = this.requiredMessage;
            }
            return { 
                isValid: false,
                errorMessage: errorMessage
             }; 
        } 
        else {
            return { isValid: true };
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
}
