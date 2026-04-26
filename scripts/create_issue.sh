#!/bin/bash
# Usage: ./create_issue.sh "title" "body" "label1,label2"
gh issue create \
  --repo dev-fatima-24/VacciChain \
  --title "$1" \
  --body "$2" \
  --label "$3" 2>&1
sleep 1
