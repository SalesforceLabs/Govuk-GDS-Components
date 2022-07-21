#!/bin/zsh

echo "Creating Scratch Org"
sfdx force:org:create -f config/project-scratch-def.json --setalias GovUKGDS --durationdays 7 --setdefaultusername --json --loglevel fatal

echo "Creating Digital Experiences (Communities)"
sfdx force:community:create  --name "GDS Demo" --templatename "Build Your Own"  --urlpathprefix "gdsdemo" --description "A Simple GDS Demo Community"
echo "Waiting for community to build ..."
sleep 20
sfdx force:community:create  --name "GDS Landing" --templatename "Salesforce Tabs + Visualforce"  --urlpathprefix "gdslanding" --description "A visual force commmunity for GDS progressive enhancement"
echo "Waiting for community to build ..."
sleep 20

echo "Pushing Source"
sfdx force:source:push -f

echo "Publishing Community"
sfdx force:community:publish --name "GDS Demo"
echo "Waiting for community to publish ..."
sleep 10

echo "Opening Org"
sfdx force:org:open