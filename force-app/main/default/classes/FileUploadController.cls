public without sharing class FileUploadController {
    
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
            List<Id> lstCntDocIds = new List<Id>();
            List<ContentDocumentLink> lstCntDocLinkToInsert = new List<ContentDocumentLink>();
            if(!lstCntVerIds.isEmpty()) {
                for(ContentVersion objCntVer : [SELECT ContentDocumentId FROM ContentVersion WHERE Id IN :lstCntVerIds]) {
                    ContentDocumentLink objCntDocLink = new ContentDocumentLink();
                    objCntDocLink.ContentDocumentId = objCntVer.ContentDocumentId;
                    objCntDocLink.LinkedEntityId = strRecId;
                    objCntDocLink.ShareType = 'V';
                    lstCntDocLinkToInsert.add(objCntDocLink);
                }
                
                if(!lstCntDocLinkToInsert.isEmpty()) {
                    Database.INSERT(lstCntDocLinkToInsert);
                }
            }
        }  
    }
    
    public class FileInfo {
        public String Title;
        public Blob VersionData;
    }
    
}