public with sharing class FileUploadController {
    
    @AuraEnabled
    public static void saveFiles(List<Object> filesToInsert, String strRecId) { 
        List<Id> lstCntVerIds = new List<Id>();
        List<ContentVersion> lstVersionsToInsert = new List<ContentVersion>();
        for (Object objFile : filesToInsert) {
            FileInfo fileData = (FileInfo)JSON.deserialize(JSON.serialize(objFile), FileInfo.class);
            ContentVersion objCntVersion = new ContentVersion();
            objCntVersion.PathOnClient = fileData.Title;
            objCntVersion.Title = fileData.Title;
            objCntVersion.VersionData = fileData.VersionData;
            lstVersionsToInsert.add(objCntVersion);
        }
        
        if(!lstVersionsToInsert.isEmpty()) {
            List<Database.SaveResult> res = Database.INSERT(lstVersionsToInsert);
            for (Database.SaveResult saveResult : res) {
                if(saveResult.isSuccess()) {
                    lstCntVerIds.add(saveResult.getId());
                }
            }
            List<ContentDocumentLink> lstCntDocLinkToInsert = getLstCntDocLink(lstCntVerIds, strRecId);
            if(!lstCntDocLinkToInsert.isEmpty()) {
                try {
                    List<Database.SaveResult> res2 = Database.INSERT(lstCntDocLinkToInsert);
                } catch (DmlException dmlEx) {
                    throw new AuraHandledException('Could not insert document to database. Check user permissions ' + dmlEx.getMessage());
                }
            }
        }  
    }
    
    private static List<ContentDocumentLink> getLstCntDocLink(List<Id> lstCntVerIds, String strRecordId) {
        List<ContentDocumentLink> lstCntDocLink = new List<ContentDocumentLink>();
        List<ContentVersion> lstContVersion = new List<ContentVersion>();
        if(!lstCntVerIds.isEmpty()) {
            if(ContentVersion.SObjectType.getDescribe().isAccessible()) {
                lstContVersion = [SELECT ContentDocumentId FROM ContentVersion WHERE Id IN :lstCntVerIds];
            }
            for(ContentVersion objCntVer : lstContVersion) {
                ContentDocumentLink objCntDocLink = new ContentDocumentLink();
                objCntDocLink.ContentDocumentId = objCntVer.ContentDocumentId;
                objCntDocLink.LinkedEntityId = strRecordId;
                objCntDocLink.ShareType = 'V';
                lstCntDocLink.add(objCntDocLink);
            }
        }
        return lstCntDocLink;
    }
    
    public class FileInfo {
        public String Title;
        public Blob VersionData;
    }
    
}