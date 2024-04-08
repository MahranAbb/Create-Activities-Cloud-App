import { Injectable } from '@angular/core';
import { Sets } from '../models/set';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { merge } from 'lodash';
import { ActivityMappingDef, defaultActivityMappings } from '../models/activity-mapping';
import { CloudAppRestService, CloudAppSettingsService } from '@exlibris/exl-cloudapp-angular-lib';
import { Settings } from '../models/settings';
import { CodeTable, MappingTable } from '../models/confTables';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private _settings: Settings;
  anyRow: CodeTable.Row = {
    code: "Any",
    description: "Any"
  };

  constructor( 
    private restService: CloudAppRestService,
    private settingsService: CloudAppSettingsService
  ) {  }

  searchSets(name: string = null, type: string = 'IER'): Observable<Sets> {
    let params = { 'content_type': type }
    if (name) params['q'] = `name~${name}`;
    return this.restService.call( {
      url: '/esploro/v1/researchconf/sets',
      queryParams: params
    }).pipe(map( results => results as Sets))
  }

  getCodeTable(name: string = null): Observable<CodeTable.Rows> {
    return this.restService.call( {
      url: '/esploro/v1/researchconf/code-tables/' + name
    }).pipe(map( results => results as CodeTable.Rows))
  }

  getMappingTable(name: string = null): Observable<MappingTable.Rows> {
    return this.restService.call( {
      url: '/esploro/v1/conf/mapping-tables/' + name
    }).pipe(map( results => results as MappingTable.Rows))
  }

  addAnyRow(rows: CodeTable.Row[]) {
    rows.push(this.anyRow);
    return rows;
  }

  /** Retrieve settings  */
  getSettings(): Observable<Settings> {
    if (this._settings) {
      return of(this._settings);
    } else {
      return this.settingsService.get()
        .pipe(
          map(settings=> {
            if (Object.keys(settings).length==0 || Array.isArray(settings.activityMapping)) {
              /* Default or old settings */
              return new Settings()
            } else {
              /* Merge new settings and URLs */
              settings.activityMappings = merge(defaultActivityMappings, settings.activityMapping);
              return settings;
            }
          }
          ),
          tap(settings=>this._settings=settings)
        );
    }
  }

  setSettings(val: Settings) {
    this._settings = val;
    return this.settingsService.set(val);
  }

  resetSettings() {
    this._settings = null;
    return this.settingsService.remove();
  }
}