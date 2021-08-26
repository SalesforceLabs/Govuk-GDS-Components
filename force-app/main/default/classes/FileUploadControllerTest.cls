@isTest
public class FileUploadControllerTest {
        
    @isTest
    public static void saveFilesTest() {
        FileUploadController.FileInfo fileInfo = new FileUploadController.FileInfo();
        fileInfo.Title = 'title';
        fileInfo.VersionData = Blob.valueOf('Test');
        List<object> objList = new List<Object>();
        objList.add(fileInfo);
        
        Account testAccount = new Account();
        testAccount.Name='Test Account' ;
        insert testAccount;
        
        Test.startTest();
        FileUploadController.saveFiles(objList,testAccount.Id);
        Test.stopTest();
    }

}