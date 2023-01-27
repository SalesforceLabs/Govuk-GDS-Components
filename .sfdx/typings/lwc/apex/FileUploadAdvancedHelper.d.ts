declare module "@salesforce/apex/FileUploadAdvancedHelper.getKey" {
  export default function getKey(): Promise<any>;
}
declare module "@salesforce/apex/FileUploadAdvancedHelper.encrypt" {
  export default function encrypt(param: {recordId: any, encodedKey: any}): Promise<any>;
}
declare module "@salesforce/apex/FileUploadAdvancedHelper.createContentVers" {
  export default function createContentVers(param: {fileNames: any, encodedRecordId: any}): Promise<any>;
}
declare module "@salesforce/apex/FileUploadAdvancedHelper.appendDataToContentVersion" {
  export default function appendDataToContentVersion(param: {versionId: any, base64Data: any}): Promise<any>;
}
declare module "@salesforce/apex/FileUploadAdvancedHelper.createContentDocLink" {
  export default function createContentDocLink(param: {versIds: any, encodedKey: any, visibleToAllUsers: any}): Promise<any>;
}
declare module "@salesforce/apex/FileUploadAdvancedHelper.updateFileName" {
  export default function updateFileName(param: {versIds: any, fileName: any}): Promise<any>;
}
declare module "@salesforce/apex/FileUploadAdvancedHelper.deleteContentDoc" {
  export default function deleteContentDoc(param: {versId: any}): Promise<any>;
}
declare module "@salesforce/apex/FileUploadAdvancedHelper.getExistingFiles" {
  export default function getExistingFiles(param: {recordId: any}): Promise<any>;
}
