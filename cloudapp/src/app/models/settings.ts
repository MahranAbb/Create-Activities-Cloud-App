import { defaultActivityMappings, ActivityMappings } from "./activity-mapping";

export class Settings {
    activitiesVisibilityPublicProfile: boolean = true;
    activitiesVisibilityResearcherProfile: boolean = true;
    activitiesLanguage: string = "und";
    activityMappings: ActivityMappings = defaultActivityMappings;
}