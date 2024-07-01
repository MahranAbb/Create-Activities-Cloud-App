import { Component, OnInit, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { Settings } from '../models/settings';
import { activityMappingFormGroup, settingsFormGroup } from './service-utils';
import { TranslateService } from '@ngx-translate/core';
import { CanDeactivate } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { snakeCase, startCase } from 'lodash';
import { Observable, forkJoin, of } from 'rxjs';
import { AddMappingDialog, AddMappingDialogResult } from './add-mapping-dialog.component';
import { DialogService } from 'eca-components';
import { ConfTable } from '../models/confTables';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  form: FormGroup;
  saving = false;
  esploroResourceTypes: ConfTable.Code[];
  esploroContributorTypes: ConfTable.Code[] = [];
  esploroActivityCategories: ConfTable.Code[] = [];
  esploroActivityTypes: ConfTable.Code[] = [];
  esploroActivityRolesMapping: ConfTable.Mapping[] = [];  
  activityRoles: ConfTable.Code[] = [];
  degreeAwardedList: ConfTable.Code[] = [];
  languagesList: { id: string, name: string }[] = [{id: "und", name : "Undefined"},
  {id: "eng", name : "English"},{id: "ger", name : "German"},{id: "dan", name : "Danish"},
  {id: "ita", name : "Italian"},{id: "fre", name : "French"},{id: "ara", name : "Arabic"}];
  allEtds: ConfTable.Code = {
    code: "allEtds",
    description: "ETD + External ETD"
  };

  constructor(
    private translate: TranslateService,
    private alert: AlertService,
    private configService: ConfigService,
    private dialog: DialogService,
  ) { 
    forkJoin([
      this.configService.getCodeTable('EsploroResourcetype'),
      this.configService.getCodeTable('EsploroContributortype'),
      this.configService.getCodeTable('ResearcherActivityCategories'),
      this.configService.getCodeTable('ResearcherActivityTypes'),
      this.configService.getMappingTable('ResearcherActivityRolesMapping'),
      this.configService.getCodeTable('ResearcherActivityRoles'),
      this.configService.getCodeTable('degreeNames')
    ]).subscribe(([
      resourceTypeRows, 
      contributorTypeRows, 
      activityCategoriesRows, 
      activityTypesRows, 
      activityRolesMappingRows, 
      activityRolesRows, 
      degreeAwardedRows
    ]: [
      ConfTable.CodeTable, 
      ConfTable.CodeTable, 
      ConfTable.CodeTable, 
      ConfTable.CodeTable, 
      ConfTable.MappingTable, 
      ConfTable.CodeTable, 
      ConfTable.CodeTable
    ]) => {
      this.esploroResourceTypes = resourceTypeRows.row;
      this.esploroResourceTypes.push(this.allEtds);
      
      this.configService.addAnyRow(this.esploroContributorTypes);
      this.esploroContributorTypes.push(...contributorTypeRows.row);
      
      this.esploroActivityCategories = activityCategoriesRows.row;
      this.esploroActivityTypes = activityTypesRows.row;
      this.esploroActivityRolesMapping = activityRolesMappingRows.row;
      this.activityRoles = activityRolesRows.row;
      this.degreeAwardedList = degreeAwardedRows.row;
    });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.configService.getSettings().subscribe( (settings: Settings) => {
      this.form = settingsFormGroup(settings);
    });    
  }

  save() {
    if (!this.form.valid) return;
    this.saving = true;
    
    this.configService.setSettings(this.form.value).subscribe( () => {
      this.alert.success(this.translate.instant('Settings.Saved'));
      this.form.markAsPristine();
      this.saving = false;
    },
    err => this.alert.error(err.message));
  }

  reset() {
    this.load();
  }

  restore() {
    this.dialog.confirm('Settings.RestoreConfirm')
    .subscribe( result => {
      if (!result) return;
      this.saving = true;
      this.configService.resetSettings().subscribe(()=>{
        this.saving = false;
        this.load();
      });
    })
  }

  addService() {
    this.dialog.prompt(AddMappingDialog, {
      title: 'Settings.Add',
      prompt: 'Settings.Name'
    })
    .subscribe( (result: AddMappingDialogResult ) => {
      if (!result) return;
      const name = snakeCase(result.name);
      if (!name) return;
      if (this.keys.includes(name)) {
        return this.dialog.alert({
          text: ['Settings.Exists', { name: startCase(name) }],
        });
      } 
      this.activityMapping.addControl(name, activityMappingFormGroup({
        name: startCase(name)
      }))
      this.form.markAsDirty();
    })
  }

  deleteService(key: string) {
    console.log('delete', key);
    this.dialog.confirm({
      text: ['Settings.ConfirmDelete', { name: startCase(this.activityMapping.value[key].name) }] 
    })
    .subscribe(result => {
      if (!result) return;
      this.activityMapping.removeControl(key);
      this.form.markAsDirty();
    });
  }

  get activityMapping() { 
    return this.form.get('activityMapping') as FormGroup
  }

  get keys() {
    return Object.keys(this.activityMapping.value) 
  }
}


@Injectable({
  providedIn: 'root',
})
export class SettingsGuard implements CanDeactivate<SettingsComponent> {
  constructor(
    
  ) {}

  canDeactivate(component: SettingsComponent): Observable<boolean> {
    
    return of(true);
  }
}