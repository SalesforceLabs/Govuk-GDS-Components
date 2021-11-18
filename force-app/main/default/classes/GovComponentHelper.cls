public with sharing class GovComponentHelper {

    @AuraEnabled
    public static List<NavigationMenuItem> getDefaultMenuItems(String strNavigationMenuDevName) {
        try {
            List<NavigationMenuItem> lstNavigationItems = new List<NavigationMenuItem>();
            if(
                NavigationMenuItem.SObjectType.getDescribe().isAccessible() &&
                Schema.SObjectType.NavigationMenuItem.fields.Label.isAccessible() &&
                Schema.SObjectType.NavigationMenuItem.fields.Target.isAccessible() &&
                String.isNotBlank(strNavigationMenuDevName)
            ) {
                lstNavigationItems = [SELECT Label, Target, TargetPrefs, Type FROM NavigationMenuItem WHERE NavigationLinkSet.DeveloperName = :strNavigationMenuDevName AND Status = 'Live' ORDER BY Position ASC];
            }
            return lstNavigationItems;
        }
        catch(Exception e) {
            throw new AuraHandledException('Could not get default menu items due to ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static List<String> getPicklistValuesByObjectField(String strSObjectFieldName){
        List<String> lstPicklistValues = new List<String>();
        if(String.isNotBlank(strSObjectFieldName)) { 
            List<String> lstSplitStrings = strSObjectFieldName.split('\\.');
            if(!lstSplitStrings.isEmpty()) {
                Schema.SobjectField theField = Schema.getGlobalDescribe().get(lstSplitStrings[0]).getDescribe().fields.getMap().get(lstSplitStrings[1]);
                Schema.DescribeFieldResult theFieldDescription = theField.getDescribe();
                List<Schema.PicklistEntry> ple = theFieldDescription.getPicklistValues();
                for( Schema.PicklistEntry pickListVal : ple) {
                    lstPicklistValues.add(pickListVal.getLabel());
                }
            }  
        }
        return lstPicklistValues;
    }
    
}