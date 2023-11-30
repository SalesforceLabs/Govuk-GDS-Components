@isTest
public class GovComponentHelperTest {

    @isTest
    public static void getDefaultMenuItemsTest() {
        Test.startTest();
        List<NavigationMenuItem> navItems = GovComponentHelper.getDefaultMenuItems('Default_Navigation');
        for (NavigationMenuItem navigationMenuItem : navItems) {
            System.assert(navigationMenuItem.Label != null, 'NavigationMenuItem Label should not be null');
        }
        Test.stopTest();
    }

    @isTest
    public static void getPicklistValuesByObjectFieldTest() {
        Test.startTest();
        
        Map<String, String> sourceMap = GovComponentHelper.getPicklistValuesByObjectField('Account.AccountSource');
        
        Assert.areNotEqual(null, sourceMap,'The picklist item should not be null');

        Test.stopTest();
    }

    @isTest
    public static void getPicklistValuesByObjectFieldTestOld() {
        Test.startTest();
        List<String> sourceList = GovComponentHelper.getPicklistValuesByObjectFieldOld('Account.AccountSource');
        for (String itemInList : sourceList) {
            System.assert(sourceList != null, 'The picklist item should not be null');
        }
        Test.stopTest();
    }
    
}