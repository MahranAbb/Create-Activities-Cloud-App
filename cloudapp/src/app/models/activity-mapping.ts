export interface ActivityMappingDef {
  name: string,
  assetCategory?: string,
  assetType?: string,
  creatorRole?: string,
  activityCategory?: string,
  activityType?: string,
  activityResearcherRole?: string
}

export interface ActivityMappings {
  [key: string]: ActivityMappingDef
}

export const defaultActivityMappings: ActivityMappings = {
  "Advisor" : {
    "name" : "Advisor",
    "assetCategory": "allEtds",
    "assetType": "Any",
    "creatorRole": "Advisor",
    "activityCategory": "activity.advising",
    "activityType": "activity.thesisAdvisor",
    "activityResearcherRole": "activity.supervisor"
  },
  "Chair": {
    "name" : "Chair",
    "assetCategory": "allEtds",
    "assetType": "Any",
    "creatorRole": "Chair",
    "activityCategory": "activity.advising",
    "activityType": "activity.thesisComMember",
    "activityResearcherRole": "activity.contributor"
  },
  "Co-Chair" : {
    "name" : "Co-Chair",
    "assetCategory": "allEtds",
    "assetType": "Any",
    "creatorRole": "Co-Chair",
    "activityCategory": "activity.advising",
    "activityType": "activity.thesisComMember",
    "activityResearcherRole": "activity.contributor"
  },
  "Committee Member" : {
    "name" : "Committee Member",
    "assetCategory": "allEtds",
    "assetType": "Any",
    "creatorRole": "Committee Member",
    "activityCategory": "activity.advising",
    "activityType": "activity.thesisComMember",
    "activityResearcherRole": "activity.contributor"
  },
  "Juror" : {
    "name" : "Juror",
    "assetCategory": "allEtds",
    "assetType": "Any",
    "creatorRole": "Juror",
    "activityCategory": "activity.advising",
    "activityType": "activity.thesisComMember",
    "activityResearcherRole": "activity.contributor"
  },
  "Referee" : {
    "name" : "Referee",
    "assetCategory": "allEtds",
    "assetType": "Any",
    "creatorRole": "Referee",
    "activityCategory": "activity.advising",
    "activityType": "activity.thesisComMember",
    "activityResearcherRole": "activity.contributor"
  },
  "Event": {
    "name" : "Event",
    "assetCategory": "conference",
    "assetType": "Any",
    "creatorRole": "Any",
    "activityCategory": "activity.events",
    "activityType": "activity.conference",
    "activityResearcherRole": "activity.contributor"
  },
  "Teaching & Learning": {
    "name" : "Teaching & Learning",
    "assetCategory": "teaching",
    "assetType": "Any",
    "creatorRole": "Any",
    "activityCategory": "activity.teaching",
    "activityType": "",
    "activityResearcherRole": "activity.contributor"
  }
}