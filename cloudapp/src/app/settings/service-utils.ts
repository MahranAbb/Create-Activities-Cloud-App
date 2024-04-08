import { ActivityMappingDef } from "../models/activity-mapping";
import { FormGroup, FormControl, Validators, FormArray } from "@angular/forms";
import { Settings } from "../models/settings";

export const settingsFormGroup = (settings: Settings): FormGroup => {
  let activityMappingFormGroups = new FormGroup({});
  Object.entries(settings.activityMappings).forEach(([key, value]) => 
    activityMappingFormGroups.addControl(key, activityMappingFormGroup(value))
  );
  return new FormGroup({
    activitiesVisibility: new FormControl(settings.activitiesVisibility),
    activitiesLanguage: new FormControl(settings.activitiesLanguage),
    activityMapping: activityMappingFormGroups
  });
}

export const activityMappingFormGroup = (value: ActivityMappingDef) => {
  return new FormGroup({
    name: new FormControl(value.name, Validators.required),
    assetCategory : new FormControl(value.assetCategory),
    assetType: new FormControl(value.assetType),
    creatorRole: new FormControl(value.creatorRole),
    activityCategory: new FormControl(value.activityCategory),
    activityType: new FormControl(value.activityType),
    activityResearcherRole: new FormControl(value.activityResearcherRole)
  })
}