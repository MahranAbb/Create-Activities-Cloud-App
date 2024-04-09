import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Asset, Assets } from '../models/asset';
import { SetMembers } from '../models/set';
import { CloudAppRestService, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib';

@Injectable({
  providedIn: 'root'
})
export class AssetService {

  constructor( private restService: CloudAppRestService ) { }

  /** Retrieve Assets objects for specified MMS_IDs */
  getAssets (mmsIds: string, pageNumber = 0, pageSize = 100): Observable<Assets> {
    const params = { 
        limit: pageSize.toString(),
        offset: (pageSize*pageNumber).toString() 
      }
    return this.restService.call( {
      url: `/esploro/v1/assets/${mmsIds}`,
      queryParams: params
    }).pipe(map( results => results as Assets ), catchError(err=>of({totalRecordCount: 0, records: []})))
  }

  /** Retrieve MMS_IDs from set of Assets */
  getMmsIdsFromSet( setId: string, pageNumber = 0, pageSize = 10 ): Observable<SetMembers> {
    const params = { 
      limit: pageSize.toString(),
      offset: (pageSize*pageNumber).toString() 
    }
    return this.restService.call( {
      url: `/esploro/v1/researchconf/sets/${setId}/members`,
      queryParams: params
    }).pipe(map( results => results as SetMembers ))
  } 
}