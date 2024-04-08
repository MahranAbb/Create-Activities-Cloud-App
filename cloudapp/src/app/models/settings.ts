import { defaultActivityMappings, ActivityMappings } from "./activity-mapping";

export class Settings {
    activitiesVisibility: boolean = true;
    activitiesLanguage: string = "N/A";
    activityMappings: ActivityMappings = defaultActivityMappings;
}