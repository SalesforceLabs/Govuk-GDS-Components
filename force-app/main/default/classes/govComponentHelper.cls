/*
 Developed by The Boost Team (Salesforce)

 Simon Cook & Jeremy Pritchard
 */


public with sharing class govComponentHelper {

    @AuraEnabled
    public static List<NavigationMenuItem> getDefaultMenuItems() {
        try {
            // get the default menu id
            Id defaultMenuId = [SELECT Id FROM NavigationLinkSet WHERE DeveloperName = 'Default_Navigation' LIMIT 1].Id;

            // get the menu items
            return [SELECT Id,Label,Target FROM NavigationMenuItem WHERE NavigationLinkSetId = :defaultMenuId AND Status = 'Live' ORDER BY Position ASC NULLS FIRST];
        }
        catch(Exception e) {
            throw new AuraHandledException('Could not get default menu items due to ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static List<String> getPicklistValuesByObjectField(String field){
        List<String> splitString = field.split('\\.');
        List<String> values= new List<String>();
        Schema.SobjectField theField = Schema.getGlobalDescribe().get(splitString[0]).getDescribe().fields.getMap().get(splitString[1]);
        Schema.DescribeFieldResult theFieldDescription= theField.getDescribe();
        List<Schema.PicklistEntry> ple = theFieldDescription.getPicklistValues();
        for( Schema.PicklistEntry pickListVal : ple){
            values.add(pickListVal.getLabel());
        }
        return values;
    }
    
}
