/**
 * FileUploadAdvancedHelper
 *
 * Server-side helper for the guest-friendly file upload LWC. Creates
 * ContentVersion / ContentDocumentLink records on behalf of the caller.
 *
 * SECURITY MODEL
 * The authorisation control for this flow is encryption of the related
 * record Id (see getKey / encrypt / decrypt below), NOT field-level
 * security. The Guest_Record_fileupload__c custom field holds an
 * AES-256 ciphertext of the LinkedEntityId; FLS on that field is
 * intentionally not granted to users. For that reason the DML calls
 * below opt out of user-mode enforcement with AccessLevel.SYSTEM_MODE.
 *
 * CHANGELOG
 * 2026-10-24 — API version bumped 56.0 -> 68.0. Starting at API 67,
 *   Apex DML/SOQL runs in user mode by default, enforcing CRUD + FLS
 *   on the running user. Guest and standard users do not hold Edit
 *   FLS on ContentVersion.VersionData or on the managed custom field
 *   Guest_Record_fileupload__c, so the previously-passing DML now
 *   throws DmlException ("fields being inaccessible"). Each DML site
 *   that writes ContentVersion / ContentDocument / ContentDocumentLink
 *   is now wrapped with AccessLevel.SYSTEM_MODE to preserve the
 *   encryption-based authorisation model.
 *
 * REFERENCES
 * Apex user mode vs system mode (API 67 default change):
 *   https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_classes_perms_enforcing.htm
 * Run SOQL and DML in user mode:
 *   https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_classes_perms_enforcing_user_mode.htm
 * Database.AccessLevel enum:
 *   https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_enum_System_AccessLevel.htm
 * Winter '27 release notes landing page:
 *   https://help.salesforce.com/s/articleView?id=release-notes.salesforce_release_notes.htm&release=256&type=5
 */
public without sharing class FileUploadAdvancedHelper{

    @AuraEnabled(cacheable = true)
    public static String getKey(){
        // System.debug('inside getKey');
        Blob key = Crypto.generateAesKey(256);
        // System.debug('inside key:' + key);
        String encodedKey = EncodingUtil.base64Encode(key);
        // System.debug('encodedKey: ' + encodedKey);
        return encodedKey;
    }
    
    @AuraEnabled(cacheable = true)
    public static String encrypt(String recordId, String encodedKey){
        // System.debug('inside en crypt recordId:' + recordId + ' encodedKey: ' + encodedKey);
        Blob key = EncodingUtil.base64Decode(encodedKey);
        Blob value = Crypto.encryptWithManagedIV('AES256', key, Blob.valueOf(recordId));
        String encodedValue = EncodingUtil.base64Encode(value);
        return encodedValue;
    }

    @AuraEnabled 
    public static List<objFiles> createContentVers(List<String> fileNames, String encodedRecordId){
        // System.debug('inside createContentVers files + count:' + fileNames +  fileNames.size() + ' encodedRecordId:' + encodedRecordId);
        List<ContentVersion> versions = new List<ContentVersion>();
        for(String fileName : fileNames){
            Integer startOfExtension = fileName.lastIndexOf('.');
            ContentVersion version = new ContentVersion(
                Title = fileName.Substring(0,startOfExtension),
                PathOnClient = '/'+fileName,
                VersionData = Blob.valueOf(' '),
                IsMajorVersion = FALSE,
                Guest_Record_fileupload__c = encodedRecordId
            );
            versions.add(version);
        }

        // SYSTEM_MODE: writes managed field Guest_Record_fileupload__c (encrypted blob)
        // which guest/standard users do not hold Edit FLS on. See class header.
        List<Database.SaveResult> results = Database.insert(versions, AccessLevel.SYSTEM_MODE);

        List<Id> versionIds = new List<Id>();
        for(Database.SaveResult result : results){
            versionIds.add(result.getId());
        }

        Boolean isStandardUser = UserInfo.getUserType() == 'Standard';
        List<objFiles> objFiles = new List<objFiles>();
        for(ContentVersion version : [SELECT Id, ContentDocumentId, ContentDocument.Title, ContentDocument.FileExtension FROM ContentVersion WHERE Id IN :versionIds ORDER BY Id]){
            objFiles objFile = new objFiles();
            objFile.name = version.ContentDocument.Title +'.'+ version.ContentDocument.FileExtension;
            objFile.contentVersionId = version.Id;

            if(isStandardUser){
                objFile.documentId = version.ContentDocumentId;
            }
            
            objFiles.add(objFile);
        }

        return objFiles;
    }

    @AuraEnabled 
    public static void appendDataToContentVersion(String versionId, String base64Data){
        // System.debug('inside appendDataToContentVersiion versionId: ' + versionId + ' base64Data: ' + base64Data);
        ContentVersion vers = [SELECT Id, VersionData FROM ContentVersion WHERE Id = :versionId];
        String existingVersionData = EncodingUtil.base64Encode(vers.VersionData);
        if(existingVersionData == 'IA=='){
            vers.VersionData = EncodingUtil.base64Decode(base64Data);
        } else {
            vers.VersionData = EncodingUtil.base64Decode(existingVersionData + base64Data);
        }
        // SYSTEM_MODE: ContentVersion.VersionData is not Edit-FLS-granted to end users.
        Database.update(vers, AccessLevel.SYSTEM_MODE);
    }
    
    @AuraEnabled
    public static void createContentDocLink(List<String> versIds, String encodedKey, Boolean visibleToAllUsers){
        try {
            System.debug('inside createContentDocLink verIds + count: ' + versIds + versIds.size() + ' encodedKey: '+ encodedKey + 'visibleToAllUsers: ' + visibleToAllUsers);
            List<ContentDocumentLink> links = new List<ContentDocumentLink>();
            for(ContentVersion vers : [SELECT Id, ContentDocumentId, Guest_Record_fileupload__c FROM ContentVersion WHERE Id IN :versIds]){

                String grf = decrypt(vers.Guest_Record_fileupload__c, encodedKey);
                System.debug('Guest_Record_fileupload__c (decrypted): ' + grf);

                ContentDocumentLink link = new ContentDocumentLink(
                    ContentDocumentId = vers.ContentDocumentId,
                    LinkedEntityId = decrypt(vers.Guest_Record_fileupload__c, encodedKey)
                );
                if(visibleToAllUsers != null){
                    if(visibleToAllUsers){
                        link.Visibility = 'AllUsers';
                    }
                }
                links.add(link);
                System.debug('*** link.ContentDocumentIdk: ' + link.ContentDocumentId);
                System.debug('*** link.LinkedEntityId: ' + link.LinkedEntityId);
            }

            if(!links.isEmpty()){
                // SYSTEM_MODE: ContentDocumentLink inserts for guest-authored content.
                Database.insert(links, AccessLevel.SYSTEM_MODE);
            }

        } catch (Exception ex) {
            System.debug('*** Error from createContentDocLink: ' + ex.getMessage());
        }
        
    }

    @AuraEnabled
    public static void updateFileName(List<String> versIds, String fileName){
        // System.debug('inside updateFIleName versIds + count: ' + versIds + versIds.size() + ' fileName:' + fileName);
        List<ContentDocument> docs = new List<ContentDocument>();
        for(ContentVersion vers : [SELECT Id, ContentDocumentId, ContentDocument.Title FROM ContentVersion WHERE Id IN :versIds]){
            if(vers.ContentDocument.Title != fileName){
                ContentDocument doc = new ContentDocument(
                    Id = vers.ContentDocumentId,
                    Title = fileName
                );
                docs.add(doc);
            }
        }
        if(!docs.isEmpty()){
            // SYSTEM_MODE: ContentDocument.Title rename for user-visible file name.
            Database.update(docs, AccessLevel.SYSTEM_MODE);
        }
    }

    @AuraEnabled
    public static void deleteContentDoc(String versId){
        // System.debug('inside deleteContentDoc');
        ContentVersion cv = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :versId LIMIT 1];
        ContentDocument cd = new ContentDocument(Id=cv.ContentDocumentId);
        // SYSTEM_MODE: deletion of guest-uploaded content documents.
        Database.delete(cd, AccessLevel.SYSTEM_MODE);
    }

   @AuraEnabled
    public static List<objFiles> getExistingFiles(String recordId){
        // System.debug('inside getExistingFiles recordId: ' + recordId);
        Boolean isStandardUser = UserInfo.getUserType() == 'Standard';
        Map<Id,objFiles> objFiles = new Map<Id,objFiles>();
        for(ContentDocumentLink link : [SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.FileExtension FROM ContentDocumentLink WHERE LinkedEntityId = :recordId]){
            objFiles files = new objFiles();
            files.name = link.ContentDocument.Title +'.'+ link.ContentDocument.FileExtension;
            if(isStandardUser){
                files.documentId = link.ContentDocumentId;
            }
            objFiles.put(link.ContentDocumentId,files);
        }
        for(ContentVersion vers : [SELECT Id, ContentDocumentId FROM ContentVersion WHERE ContentDocumentId IN :objFiles.keyset() AND IsLatest = TRUE]){
            objFiles.get(vers.ContentDocumentId).contentVersionId = vers.Id;
        }
        return objFiles.values();
    }

    public class objFiles{
        @AuraEnabled
        public string name;

        @AuraEnabled
        public string documentId;

        @AuraEnabled
        public string contentVersionId;
    }

    @InvocableMethod(
        label='Create Content Document Links Downstream'
        description='Sometimes when using File Upload Improved you don\'t know the Related Record Id until after your user has already uploaded files. Use this Invocable Method to create the Content Document Links downstream in your flow.'
        category='File Upload Improved'
    )
    public static void createContentDocumentLinkDownstream(List<Input> inputs){
        // System.debug('inside createContentDocumentLinkDownstream inputs + count :' + inputs + inputs.size());
        Set<Id> setContentVersIds = new Set<Id>();
        for(Input input : inputs){
            setContentVersIds.addAll(input.versIds);
        }
        setContentVersIds.remove(null);
        if(!setContentVersIds.isEmpty()){
            Map<Id,Id> mapVersIdToDocId = new Map<Id,Id>();
            for(ContentVersion vers : [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id IN :setContentVersIds]){
                mapVersIdToDocId.put(vers.Id,vers.ContentDocumentId);
            }
            Map<Id,Set<Id>> mapDocIdToRecordIds = new Map<Id,Set<Id>>();
            for(ContentDocumentLink doc : [SELECT ContentDocumentId, LinkedEntityId FROM ContentDocumentLink WHERE ContentDocumentId IN :mapVersIdToDocId.values()]){
                Id docId = doc.ContentDocumentId;
                Id recordId = doc.LinkedEntityId;
                if(mapDocIdToRecordIds.get(docId) == null){
                    mapDocIdToRecordIds.put(docId,new Set<Id>());
                }
                mapDocIdToRecordIds.get(docId).add(recordId);
            }
            List<ContentDocumentLink> links = new List<ContentDocumentLink>();
            for(Input input : inputs){
                Id recordId = input.recordId;
                Boolean visibleToAllUsers = input.visibleToAllUsers == null ? FALSE : input.visibleToAllUsers;
                for(Id versId : input.versIds){
                    Id docId = mapVersIdToDocId.get(versId);
                    if(docId != null){
                        if(mapDocIdToRecordIds.get(docId).contains(recordId)){
                            continue;
                        } else {
                            ContentDocumentLink link = new ContentDocumentLink(
                                ContentDocumentId = docId,
                                LinkedEntityId = recordId
                            );
                            if(visibleToAllUsers){
                                link.Visibility = 'AllUsers';
                            }
                            links.add(link);
                        }
                    }
                }
            }
            if(!links.isEmpty()){
                // SYSTEM_MODE: downstream link creation from invocable flow context.
                Database.insert(links, AccessLevel.SYSTEM_MODE);
            }
        } else {
            return;
        }
        
    }

    public class Input{
        @InvocableVariable(
            label='Collection of Content Version Ids'
            required=true
        )
        public List<Id> versIds;

        @InvocableVariable(
            label='Related Record Id'
            required=true
        )
        public Id recordId;

        @InvocableVariable(
            label='Visible to All Users?'
        )
        public Boolean visibleToAllUsers;
    }

    private static String decrypt(String encodedValue, String encodedKey){
        // System.debug('inside dedrypt encodedValue: ' + encodedValue + ' encodedKey:' + encodedKey);
        Blob key = EncodingUtil.base64Decode(encodedKey);
        Blob value = EncodingUtil.base64Decode(encodedValue);
    	Blob decryptedBlob = Crypto.decryptWithManagedIV('AES256', key, value);
    	String recordId = decryptedBlob.toString();
        return recordId;
    }
}