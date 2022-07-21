#!/bin/zsh

echo "Creating Scratch Org"
sfdx force:org:create -f config/project-scratch-def.json --setalias GovUKGDS1_6BETA --durationdays 30 --setdefaultusername --json --loglevel fatal

echo "Deploying Source"
sfdx force:source:deploy -p "./force-app/main/default"

echo "Opening Org"
sfdx force:org:open