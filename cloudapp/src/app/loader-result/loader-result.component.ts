import { Component, Injectable, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { ConfigService } from "../services/config.service";
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { AssetService } from "../services/asset.service";
import { ActivitiesService } from "../services/activities.service";
import { Asset, Assets, Creator } from "../models/asset";
import { catchError, expand, map, reduce, switchMap, tap } from "rxjs/operators";
import { EMPTY, Observable, forkJoin, of } from "rxjs";
import { SetMember, SetMembers } from "../models/set";
import { Settings } from "../models/settings";
import { ActivityMappingDef, ActivityMappings } from "../models/activity-mapping";
import { Activity, AssetActivitiesResponse } from "../models/activity";
import { ConfTable } from "../models/confTables";

@Component({
  selector: 'app-loader-result',
  templateUrl: './loader-result.component.html',
  styleUrls: ['./loader-result.component.scss']
})
export class LoaderResultComponent implements OnInit {
  displayedColumns: string[] = ['id', 'title', 'activities'];
  setId: string;
  mmsIds: string[];
  assets: Assets;
  status = { isLoading: false, recordCount: 0, percentComplete: -1 };
  settings: Settings;
  matchedAssetsMap: Map<string, Asset[]> = new Map();
  assetToActivitiesMap: Map<string, Activity[]>;
  assetActivitiesResponse: Map<string, AssetActivitiesResponse> = new Map();
  dataSource: MatTableDataSource<AssetActivitiesResponse>;

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor( 
    private assetService: AssetService, 
    private configService: ConfigService,
    private activitiesService: ActivitiesService,
    private route: ActivatedRoute
  ) { }

  async ngOnInit() {
    this.setId = this.route.snapshot.params['setId'];
    if (this.route.snapshot.params['mmsIds'])
      this.mmsIds = this.route.snapshot.params['mmsIds'].split(',');
    await this.createActivities();
    this.dataSource = new MatTableDataSource(Array.from(this.assetActivitiesResponse.values()));
    this.page();
  }

  get totalRecords() {
    return this.assetActivitiesResponse 
      ? this.assetActivitiesResponse.size
      : 0;
  }

  async createActivities() {
    this.status.isLoading = true;

    try {
        // Variable to hold the observable for getAllMmsIdsFromSet
        let getAllMmsIds$: Observable<string[]>;

        // If setId is not null, call getAllMmsIdsFromSet
        if (this.setId != null) {
            getAllMmsIds$ = this.getAllMmsIdsFromSet(this.setId).pipe(
                tap(setMmsIds => {
                    this.mmsIds = setMmsIds;
                    console.log('All MMS IDs:', this.mmsIds);
                })
            );
        } else {
            // If setId is null
            getAllMmsIds$ = of(this.mmsIds);
        }

        // Wait for getAllMmsIds$ to complete
        await getAllMmsIds$.toPromise();

        // Call getAssetsForMmsIds after getAllMmsIdsFromSet is done
        const { assets, settings } = await forkJoin({
            assets: this.getAssetsForMmsIds(this.mmsIds),
            settings: this.configService.getSettings()
        }).toPromise();

        this.settings = settings;
        this.matchedAssetsMap = this.matchActivityMappings(assets.records, this.settings.activityMappings);

        console.log(this.matchedAssetsMap);

        this.assetToActivitiesMap = await this.createActivitiesFromAssets(this.matchedAssetsMap, this.settings.activityMappings, this.settings.activitiesVisibilityPublicProfile, this.settings.activitiesVisibilityResearcherProfile, this.settings.activitiesLanguage);
        console.log(this.assetToActivitiesMap);

        let totalRecords = 0;
        this.assetToActivitiesMap.forEach((activities: Activity[]) => {
            totalRecords += activities.length;
        });
        console.log(totalRecords);

        this.assetToActivitiesMap.forEach((activities: Activity[], key: string) => {
          let assetResponse = {
            id: key,
            title: assets.records.filter(asset => asset.originalRepository.assetId == key)[0].title,
            activities: []
          }
          this.assetActivitiesResponse.set(key, assetResponse);
          // Call createActivity for each activity array
          const constResponses = this.assetActivitiesResponse;
          activities.forEach(activity => {
            this.activitiesService.createActivity(activity).subscribe(response => {
              constResponses.get(key).activities.push({
                researcherName: activity.member_researcher[0].user_primary_id,
                status: true, 
                msg: '' 
              });
            },
            error => {
                console.error('Error creating activity:', error);
                
                constResponses.get(key).activities.push({
                  researcherName: activity.member_researcher[0].user_primary_id,
                  status: false, 
                  msg: error.message 
                });

                // Update status in case of error
                this.status.recordCount++;
                console.log(this.status.recordCount);
                this.status.percentComplete = (this.status.recordCount / totalRecords) * 100; 
            });
  
            // Update status after each call to createActivity
            this.status.recordCount++;
            console.log(this.status.recordCount);
            this.status.percentComplete = (this.status.recordCount / totalRecords) * 100; 
          });
        });

        this.status.isLoading = false;
    } catch (error) {
        console.error('Error creating activities:', error);
        this.status.isLoading = false;
    }
  }

  page() {
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    const endIndex = startIndex + this.paginator.pageSize;
    this.dataSource.data = Array.from(this.assetActivitiesResponse.values()).slice(startIndex, endIndex);
  }

  getAllMmsIdsFromSet(setId: string, pageSize: number = 100): Observable<string[]> {
    return this.assetService.getMmsIdsFromSet(setId, 0, pageSize).pipe(
      expand((result: SetMembers) => {
        const currentPageSize = result.member.length;
        const totalRecordCount = result.total_record_count;
        const totalPages = Math.ceil(totalRecordCount / pageSize);
        const nextPageNumber = currentPageSize / pageSize + 1;

        if (totalPages > nextPageNumber) {
          return this.assetService.getMmsIdsFromSet(setId, nextPageNumber, pageSize);
        } else {
          return EMPTY; // Stop recursion
        }
      }),
      map((result: SetMembers) => result.member.map((member: SetMember) => member.id)),
      reduce((acc: string[], ids: string[]) => acc.concat(ids), [])
    );
  }

  getAssetsForMmsIds(mmsIds: string[]): Observable<Assets> {
    // Batch MMS IDs into groups of up to 100 IDs each
    const batches: string[][] = [];
    const finalResult: Assets = {
      records: [],
      totalRecordCount: 0
    };
  
    for (let i = 0; i < mmsIds.length; i += 100) {
      batches.push(mmsIds.slice(i, i + 100));
    }
  
    // Make individual API calls for each batch of MMS IDs
    const requests: Observable<Assets>[] = batches.map(batch => this.assetService.getAssets(batch.join(",")));
  
    // Use forkJoin to wait for all observables to complete
    return forkJoin(requests).pipe(
      map((responses: Assets[]) => {
        // Combine the results from all batches
        responses.forEach(assets => {
          finalResult.records = finalResult.records.concat(assets.records);
          finalResult.totalRecordCount += assets.totalRecordCount;
        });
  
        // Return the final result
        return finalResult;
      })
    );
  }

  matchActivityMappings(assets: Asset[], activityMappings: ActivityMappings): Map<string, Asset[]> {
    const matchedAssetsMap: Map<string, Asset[]> = new Map();

    assets.forEach(asset => {
      const assetCopy = JSON.parse(JSON.stringify(asset)); // Deep copy of the asset
      let assetMatched = false;

      for (const key of Object.keys(activityMappings)) {
        const mappingDef = activityMappings[key];

        // Check if asset category and creator role match the mapping definition
        if (this.assetMatchesMapping(assetCopy, mappingDef)) {
          assetCopy.student = assetCopy.student || [];
          assetCopy.student.push(
            ...(assetCopy.creators || []).filter(
              creator => creator.role === 'Creator' || !creator.role
            ).map(creator => ({
              name: creator.givenname + ' ' + creator.familyname,
              department: creator.affiliationName
            }))
          );
          // Remove creators that don't match the mapping from the copied asset
          if (mappingDef.creatorRole.toLowerCase() !== 'any') {
            if (assetCopy.creators) {
                assetCopy.creators = assetCopy.creators.filter(creator => creator.role === mappingDef.creatorRole);
            }
            if (assetCopy.contributors) {
                assetCopy.contributors = assetCopy.contributors.filter(creator => creator.role === mappingDef.creatorRole);
            }
        }

          // Add the modified asset to the list of matched assets for the current mapping key
          if (!matchedAssetsMap.has(key)) {
            matchedAssetsMap.set(key, []);
          }
          matchedAssetsMap.get(key).push(assetCopy);

          assetMatched = true;
        }
      }

      if (!assetMatched) {
        // If asset doesn't match any mapping, add it to an "unmatched" category
        if (!matchedAssetsMap.has('unmatched')) {
          matchedAssetsMap.set('unmatched', []);
        }
        matchedAssetsMap.get('unmatched').push(assetCopy);
      }
    });

    return matchedAssetsMap;
  }

  assetMatchesMapping(asset: Asset, mappingDef: ActivityMappingDef): boolean {
    // Match assetCategory and assetType to resourceType_esploro
    if (mappingDef.assetCategory && mappingDef.assetType) {
      const assetCategory = asset['resourcetype.esploro'].split('.')[0];
      const assetType = asset['resourcetype.esploro'].split('.')[1];

      if (mappingDef.assetType.toLowerCase() === 'any') {
        if (mappingDef.assetCategory === "allEtds" && (assetCategory.toLowerCase() === "etd" || assetCategory.toLowerCase() === "etdexternal")) {
          return this.checkMatchingCreatorRole(asset, mappingDef);
        }
        if (mappingDef.assetCategory.toLowerCase() === assetCategory.toLowerCase()) {
          // Check for matching creator role
          return this.checkMatchingCreatorRole(asset, mappingDef);
        }
      } else {
        if (mappingDef.assetCategory.toLowerCase() === assetCategory.toLowerCase() &&
            mappingDef.assetType.toLowerCase() === assetType.toLowerCase()) {
          // Check for matching creator role
          return this.checkMatchingCreatorRole(asset, mappingDef);
        }
      }
    } else if (mappingDef.assetCategory && !mappingDef.assetType) {
      // If assetType is not specified, match only assetCategory to first part of resourceType_esploro
      const assetCategory = asset['resourcetype.esploro'].split('.')[0];
      if (mappingDef.assetCategory.toLowerCase() === assetCategory.toLowerCase()) {
        // Check for matching creator role
        return this.checkMatchingCreatorRole(asset, mappingDef);
      }
    }
  
    return false; // No match found for any mapping definition
  }
  
  private checkMatchingCreatorRole(asset: Asset, mappingDef: ActivityMappingDef): boolean {
    // Match creatorRole to Creator role
    if (mappingDef.creatorRole) {
      if (mappingDef.creatorRole.toLowerCase() === 'any') {
        // Match any creator role
        return true;
      } else {
        // Match specific creator role
        if (asset.creators && asset.creators.some(creator => creator.role && creator.role.toLowerCase() === mappingDef.creatorRole.toLowerCase())) {
          return true;
        }
        if (asset.contributors && asset.contributors.some(contributor => contributor.role && contributor.role.toLowerCase() === mappingDef.creatorRole.toLowerCase())) {
          return true;
        }
      }
    }
  
    return false; // No match found for creator role
  }

  createActivityFromAsset(asset: Asset, activityMapping: ActivityMappingDef, creator: Creator | undefined, activitiesVisibilityPublicProfile: boolean, 
    activitiesVisibilityResearcherProfile: boolean, activitiesLanguage: string, researchTopics: ConfTable.CodeTable, degreeNames: ConfTable.CodeTable): Activity {
      const {
        title,
        "title.subtitle": title_subtitle,
        "description.abstract": description_abstract,
        "subject.esploro": subject_esploro,
        keywords,
        "resourcetype.esploro": resource_type,

        "date.degree": date_degree,
        "date.published": date_published,
        "date.epublished": date_epublished,
        "date.copyrighted": date_copyrighted,
        "date.presented": date_presented,
        "date.posted": date_posted,
        "date.available": date_available,
        "date.opening": date_opening,
        "date.performance": date_performance,
        "date.valid": date_valid,
        "date.issued": date_issued,
        "date.renewed": date_renewed,
        "date.approved": date_approved,
        "date.accepted": date_accepted,
        "date.defense": date_defense,
        "date.submitted": date_submitted,
        "date.application": date_application,
        "date.completed": date_completed,
        "date.created": date_created,
        "date.collected": date_collected,
        "date.other": date_other,
        "date.updated": date_ipdated,

        "identifier.doi": identifier_doi,
        etd,
        student,
        originalRepository
    } = asset;

    // Combine all date variables
    const dates = [
      date_degree,
      date_published,
      date_epublished,
      date_copyrighted,
      date_presented,
      date_posted,
      date_available,
      date_opening,
      date_performance,
      date_valid,
      date_issued,
      date_renewed,
      date_approved,
      date_accepted,
      date_defense,
      date_submitted,
      date_application,
      date_completed,
      date_created,
      date_collected,
      date_other,
      date_ipdated
    ];

    let activityStartDate = '';
    for (const date of dates) {
      if (date) {
        if (typeof date === 'string') {
            activityStartDate = date;
            break;
        } else if (Array.isArray(date) && date.length > 0) {
            activityStartDate = date[0];
            break;
        }
      }
    }

    let memberResearchers: Activity['member_researcher'] = [];
    if (creator) {
      memberResearchers.push({
          user_primary_id: creator["user.primaryId"],
          role: activityMapping.activityResearcherRole,
          order: creator.order,
          display_in_profile: creator.isDisplayInPublicProfile,
          creator: false
      });
    }

    const links: Activity['link'] = [];
    if (identifier_doi) {
        links.push({
            link_url: "http://doi.org/" + identifier_doi,
            link_title: 'DOI Link'
        });
    }  

    // Create activity based on mapping rules
    const activity: Activity = {
        activity_category: activityMapping.activityCategory ? { desc: activityMapping.activityCategory, value: activityMapping.activityCategory } : undefined,
        activity_type: activityMapping.activityType ? { desc: activityMapping.activityType, value: activityMapping.activityType } : undefined,
        activity_name:  [{ language: activitiesLanguage, value: title }] , //add subtitle
        activity_start_date: activityStartDate,
        member_researcher: memberResearchers ,
        related_assets: [{ target_mms_id: originalRepository.assetId, visible: true, order: 1 }],
        link: links,
        profile_visibility: activitiesVisibilityResearcherProfile,
        portal_visibility: activitiesVisibilityPublicProfile,
        repository_status: {value: "approved", desc: "Approved"},
        input_method: {value: "activity.imported", desc: "activity.imported"}
    };

    if(description_abstract) {    
      // Select description based on language
      const translation = description_abstract.find(translation => translation.language === activitiesLanguage);
      if(translation) {
        let activityDescription = { language: activitiesLanguage, value: translation.value || '' };      
        activity.activity_description_translation = [activityDescription];
      }
    }

    if (subject_esploro && subject_esploro.length > 0) {
      const activitySubjects = subject_esploro.map((subject: string) => {
        const matchingRow = researchTopics.row.find(row => row.description === subject);
        return {
          subject_code: {
              desc: matchingRow?.description || '',
              value: matchingRow?.code || ''
          },
          subject_type: 'TOPIC'          
        };
      });
      
      activity.activity_subject = activitySubjects;
    }

    
    if (keywords) {
      // Select keywords based on language
      let activityKeywords: { language: string; value: string }[] = [];      
      const translation = keywords?.find(translation => translation.language === activitiesLanguage);
      if (translation) {
          activityKeywords = translation.values.map(value => ({ language: activitiesLanguage, value }));
      }      
      activity.activity_keyword_translation = activityKeywords;
    }

    let activityThesisLevel: { desc: string, value: number } = { desc: '', value: 0 };          
    const activityDegreeAwarded = {
      desc: '',
      value: ''
    };
    let degreeResult;    
    if (resource_type && etd) {
      const assetType = resource_type.split('.')[1];
        if (assetType.toLowerCase().includes("doctoral")) {
          degreeResult = this.findRowByCode(degreeNames, activityMapping.degreeAwardedDoctoral);
          activityThesisLevel = {
            desc: "Doctoral",
            value: 2
          }         
        }
        else if (assetType.toLowerCase().includes("graduate")) {
          degreeResult = this.findRowByCode(degreeNames, activityMapping.degreeAwardedGraduate);
          activityThesisLevel = {      
            desc: "Masters",
            value: 1
          }         
        }
        else if (assetType.toLowerCase().includes("undergraduate")) {
          degreeResult = this.findRowByCode(degreeNames, activityMapping.degreeAwardedUndergraduate);
          activityThesisLevel = {
            desc: "Undergraduate",
            value: 0
          }         
        }

        const activityThesisTitles = [{
          language: activitiesLanguage,
          value: `${title}${title_subtitle ? ': ' + title_subtitle : ''}`
        }];  

        if (degreeResult) {
          activityDegreeAwarded.desc = degreeResult.description;
          activityDegreeAwarded.value = degreeResult.code;
        }
        
        activity.activity_thesis_level= activityThesisLevel;
        activity.activity_thesis_title= activityThesisTitles ;
        activity.activity_degree_awarded= activityDegreeAwarded;
        activity.student = student;

    }

    return activity;
  }

  findRowByCode(codeTable: ConfTable.CodeTable, searchCode: string): ConfTable.Code | undefined {
    return codeTable.row.find(code => code.code === searchCode);
  }

  async createActivitiesFromAssets(assetMap: Map<string, Asset[]>, activityMappings: ActivityMappings, activitiesVisibilityPublicProfile: boolean, activitiesVisibilityResearcherProfile: boolean, activitiesLanguage: string): Promise<Map<string, Activity[]>> {
    const activitiesMap = new Map<string, Activity[]>();

    // Combine all API calls using forkJoin
    const confTables$ = forkJoin({
        researchTopics: this.configService.getCodeTable('ResearchTopicsLabels'),
        degreeNames: this.configService.getCodeTable('degreeNames')
    });

    // Wait for all API calls to complete
    const { researchTopics, degreeNames } = await confTables$.toPromise();

    // Process asset map
    assetMap.forEach((assets, key) => {
      const mapping = activityMappings[key];
      if (!mapping) return;

      assets.forEach(asset => {
        const activities: Activity[] = [];
        const creators = asset.creators || [];
        const contributors = asset.contributors || [];

        creators.forEach(creator => {
            const activity = this.createActivityFromAsset(asset, mapping, creator, activitiesVisibilityPublicProfile, activitiesVisibilityResearcherProfile, activitiesLanguage, researchTopics, degreeNames);
            activities.push(activity);
        });

        contributors.forEach(contributor => {
            const activity = this.createActivityFromAsset(asset, mapping, contributor, activitiesVisibilityPublicProfile, activitiesVisibilityResearcherProfile, activitiesLanguage, researchTopics, degreeNames);
            activities.push(activity);
        });

        activitiesMap.set(asset.originalRepository.assetId, activities);
      });
    });

    return activitiesMap;
  }

}

@Injectable({
  providedIn: 'root',
})
export class LoaderResultGuard implements CanActivate {
  constructor(
    public configService: ConfigService,
    private router: Router
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean {
    if ((!next.params['setId'] && !next.params['mmsIds'])) {
      this.router.navigate(['']);
      return false;
    }
    return true;
  }
}