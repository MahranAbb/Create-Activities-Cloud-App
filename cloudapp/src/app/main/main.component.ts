import { Subscription, forkJoin } from 'rxjs';
import { Observable  } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CloudAppRestService, CloudAppEventsService, Request, HttpMethod, 
  Entity, RestErrorResponse, AlertService, PageInfo, EntityType } from '@exlibris/exl-cloudapp-angular-lib';
import { MatRadioChange } from '@angular/material/radio';
//
import { Set } from '../models/set';
import { SelectSetComponent } from '../select-set/select-set.component';
import { SelectEntitiesComponent } from '../select-entities/select-entities.component';
import { Router } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';
import { ActivityMappingDef } from '../models/activity-mapping';
import { FormControl } from '@angular/forms';
import { Settings } from '../models/settings';
import { ConfigService } from '../services/config.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

  loading = false;
  selectedEntity: Entity;
  apiResult: any;

  ///
  private pageLoad$: Subscription;
  listType: ListType = ListType.SET;
  selectedSet: Set;
  mmsIds = new Set<string>();
  mappingProfiles: ActivityMappingDef[] = [];
  mappingProfile: FormControl;
  selectedProfile: ActivityMappingDef;
  entities: Entity[];
  @ViewChild('selectSet', {static: false}) selectSetComponent: SelectSetComponent;
  @ViewChild('selectBibs', {static: false}) selectBibsComponent: SelectEntitiesComponent;
  ///
  entities$: Observable<Entity[]> = this.eventsService.entities$
  .pipe(tap(() => this.clear()));
  settings: Settings;

  constructor(
    private restService: CloudAppRestService,
    private eventsService: CloudAppEventsService,
    private alert: AlertService, private router: Router,
    private configService: ConfigService
  ) { 
    this.mappingProfile = new FormControl();
  }

  ngOnInit() {
    this.loadSettings();
  }
  
  loadSettings() {
    this.configService.getSettings().subscribe(
      (settings: Settings) => {
        console.log('Settings received:', settings);
        this.settings = settings;
        this.initializeMappingProfiles(); // Move profile initialization to a separate method
        this.setupPageLoad(); // Move page load setup to a separate method
      },
      error => {
        console.error('Error loading settings:', error);
        // Handle error loading settings
      }
    );
  }
  
  initializeMappingProfiles() {
    if (this.settings && this.settings.activityMappings) {
      this.mappingProfiles = Object.values(this.settings.activityMappings);
      this.selectedProfile = this.mappingProfiles.length > 0 ? this.mappingProfiles[0] : null;
      this.mappingProfile.setValue(this.selectedProfile);
    } else {
      this.mappingProfiles = [];
      this.selectedProfile = null;
    }
  }
  
  setupPageLoad() {
    this.pageLoad$ = this.eventsService.onPageLoad(this.onPageLoad);
  }
  

  ngOnDestroy(): void {
  }

  onPageLoad = (pageInfo: PageInfo) => {
    this.entities = (pageInfo.entities||[]).filter(e=>[EntityType.BIB_MMS, 'BIB', 'IER'].includes(e.type));
    if (this.entities.length == 0) {
      this.listType = ListType.SET;
    } else if (this.listType == ListType.SET) {
      this.listType = ListType.DISPLAY;
    }
  }

  entitySelected(event: MatRadioChange) {
    const value = event.value as Entity;
    this.loading = true;
    this.restService.call<any>(value.link)
    .pipe(finalize(()=>this.loading=false))
    .subscribe(
      result => this.apiResult = result,
      error => this.alert.error('Failed to retrieve entity: ' + error.message)
    );
  }

  clear() {
    this.apiResult = null;
    this.selectedEntity = null;
  }

  update(value: any) {
    const requestBody = this.tryParseJson(value)
    if (!requestBody) return this.alert.error('Failed to parse json');

    this.loading = true;
    let request: Request = {
      url: this.selectedEntity.link, 
      method: HttpMethod.PUT,
      requestBody
    };
    this.restService.call(request)
    .pipe(finalize(()=>this.loading=false))
    .subscribe({
      next: result => {
        this.apiResult = result;
        this.eventsService.refreshPage().subscribe(
          ()=>this.alert.success('Success!')
        );
      },
      error: (e: RestErrorResponse) => {
        this.alert.error('Failed to update data: ' + e.message);
        console.error(e);
      }
    });    
  }

  private tryParseJson(value: any) {
    try {
      return JSON.parse(value);
    } catch (e) {
      console.error(e);
    }
    return undefined;
  }

  onSetSelected(set: Set) {
    this.selectedSet = set;
  }

  onRecordSelected(event) {
    if (event.checked) this.mmsIds.add(event.mmsId);
    else this.mmsIds.delete(event.mmsId);
  }

  get isValid() {
    return (
      ( (this.listType==ListType.SET && this.selectedSet!=null) ||
        (this.listType==ListType.SELECT && this.mmsIds.size!=0) || 
        (this.listType=='DISPLAY') 
      ) &&
      this.selectedProfile != null
    );
  }

  load() {
    const params = { };
    if (this.listType == ListType.SET) {
      params['setId'] = this.selectedSet.id
    } else {
      if (this.listType == ListType.DISPLAY) {
        this.mmsIds.clear();
        this.entities.map(e=>e.id).forEach(this.mmsIds.add, this.mmsIds);
      }
      params['mmsIds'] = Array.from(this.mmsIds).join(',');
    }
    params['mappingProfile'] = JSON.stringify(this.selectedProfile);
    this.router.navigate(['loaderResult', params]);
  }

  onMappingProfileSelected(event: MatSelectChange) {
    this.selectedProfile = event.source.value;
  }

  compareMappingProfiles(a: ActivityMappingDef, b: ActivityMappingDef): boolean {
    return a && b ? a.name === b.name : a === b;
  }
}

export enum ListType {
  SET = 'SET',
  DISPLAY = 'DISPLAY',
  SELECT = 'SELECT'
}