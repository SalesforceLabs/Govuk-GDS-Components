#!/bin/zsh
sfdx force:community:create  --name "GDS Demo" --templatename "Build Your Own"  --urlpathprefix "gdsdemo" --description "A Simple GDS Demo Community"
sfdx force:community:create  --name "GDS Landing" --templatename "Salesforce Tabs + Visualforce"  --urlpathprefix "gdslanding" --description "A visual force commmunity for GDS progressive enhancement"