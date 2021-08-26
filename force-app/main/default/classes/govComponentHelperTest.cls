@isTest
public class govComponentHelperTest {

    @isTest
    public static void getDefaultMenuItemsTest() {
        Test.startTest();
        govComponentHelper.getDefaultMenuItems('Default_Navigation');
        Test.stopTest();
    }

    @isTest
    public static void getPicklistValuesByObjectFieldTest() {
        Test.startTest();
        govComponentHelper.getPicklistValuesByObjectField('Account.AccountSource');
        Test.stopTest();
    }
    
}