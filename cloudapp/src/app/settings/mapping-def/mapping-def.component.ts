import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormArray, FormControl } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from 'eca-components';
import { ConfigService } from '../../services/config.service';
import { CodeTable, MappingTable } from '../../models/confTables';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-settings-mapping-def',
  templateUrl: './mapping-def.component.html',
  styleUrls: ['./mapping-def.component.scss'],
})
export class MappingDefComponent implements OnInit {
  @Input() form: FormGroup;
  @Input() esploroResourcetypes: CodeTable.Row[];
  @Input() esploroContributortypes: CodeTable.Row[];
  @Input() esploroActivityCategories: CodeTable.Row[];
  @Input() esploroActivityTypes: CodeTable.Row[];  
  @Input() esploroActivityRolesMapping: MappingTable.Row[];  
  @Input() activityRoles: CodeTable.Row[];
  @Output() onDelete = new EventEmitter();
  assetCategoryList: CodeTable.Row[];
  assetTypeList: CodeTable.Row[] = [];
  activityResearcherRoleList: CodeTable.Row[] = [];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  anyRow: CodeTable.Row = {
    code: "any",
    description: "Any"
  };

  constructor(
    private translate: TranslateService,
    private dialog: DialogService,
    private configService: ConfigService
  ) { }

  ngOnInit() {
    if (this.esploroResourcetypes) {
      this.assetCategoryList = this.esploroResourcetypes.filter(row => !row.code.includes(".") && row.code != "etdex");      
      this.configService.addAnyRow(this.assetTypeList);
      this.assetTypeList.push(...this.esploroResourcetypes.filter(row => row.code.startsWith(this.form.get("assetCategory").value + ".")));
    }
    
    if (this.esploroActivityRolesMapping && this.activityRoles) {
      let filteredRows = this.esploroActivityRolesMapping.filter(mappingRow => mappingRow.column1.includes(this.form.get("activityCategory").value) || mappingRow.column1.toLowerCase() == "all");
      this.activityResearcherRoleList = filteredRows.map(mappingRow => {
        let matchingCodeRow = this.activityRoles.find(codeRow => codeRow.code === mappingRow.column0);
        return matchingCodeRow;
      });
    }
  }

  removeField(index: number) {
    this.dialog.confirm('Settings.ServiceDef.RemoveField')
    .subscribe( result => {
      if (!result) return;
      this.fields.removeAt(index);
      this.form.updateValueAndValidity();
      this.form.markAsDirty();
    });
  }

  addChip(event: MatChipInputEvent, field: FormControl) {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      field.value.push(value.trim());
      field.markAsDirty();
    }
    if (input) {
      input.value = '';
    }
  }

  removeChip(field: FormControl, val: string) {
    const index = field.value.indexOf(val);

    if (index >= 0) {
      field.value.splice(index, 1);
      field.markAsDirty();
    }
  }

  deleteService() {
    this.onDelete.emit();
  }

  /* Accessors */
  get fields() {
    return this.form.get('fields') as FormArray;
  }

  compareAssetCategory(a: String, b: String): boolean {
    return a === b;
  }

  onAssetCategorySelected(event: MatSelectChange) {
    this.assetTypeList = this.esploroResourcetypes.filter(row => row.code.startsWith(event.source.value + "."));
    this.assetTypeList.push(this.anyRow);
  }

  compareActivityCategory(a: String, b: String): boolean {
    return a === b;
  }

  onActivityCategorySelected(event: MatSelectChange) {
    console.log(this.form.get("activityCategory").value);
    let filteredRows = this.esploroActivityRolesMapping.filter(mappingRow => mappingRow.column1.includes(this.form.get("activityCategory").value) || mappingRow.column1.toLowerCase() == "all");
    this.activityResearcherRoleList = filteredRows.map(mappingRow => {
      let matchingCodeRow = this.activityRoles.find(codeRow => codeRow.code === mappingRow.column0);
      return matchingCodeRow;
    });
    console.log(this.activityResearcherRoleList);
  }

}