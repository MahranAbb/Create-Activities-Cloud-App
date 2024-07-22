export interface ActivityMappingDef {
  name: string,
  assetCategory?: string,
  assetType?: string,
  creatorRole?: string,
  activityCategory?: string,
  activityType?: string,
  degreeAwardedDoctoral?: string,
  degreeAwardedGraduate?: string,
  degreeAwardedUndergraduate?: string,
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
    "degreeAwardedDoctoral": "PhD",
    "degreeAwardedGraduate": "MA",
    "degreeAwardedUndergraduate": "BA",
    "creatorRole": "Advisor",
    "activityCategory": "activity.advising",
    "activityType": "activity.thesisAdvisor",
    "activityResearcherRole": "activity.supervisor"
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