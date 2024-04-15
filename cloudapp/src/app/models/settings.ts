import { defaultActivityMappings, ActivityMappings } from "./activity-mapping";

export class Settings {
    activitiesVisibility: boolean = true;
    activitiesLanguage: string = "und";
    activityMappings: ActivityMappings = defaultActivityMappings;
}