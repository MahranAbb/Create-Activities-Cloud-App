  export interface Creator {
    familyname: string;
    givenname: string;
    middlename: string;
    suffix: string;
    order: number;
    additionalIdentifiers: any[]; // Adjust type as needed
    affiliation: string;
    affiliationName: string;
    role: string;
    isDisplayInPublicProfile: boolean;
    affiliationWithDesc: any; // Adjust type as needed
    creatorname: string;
    "user.primaryId": string;
  }

  interface KeywordTranslation {
    language: string;
    values: string[];
  }

  interface DescriptionTranslation {
    language: string;
    value: string;
  }

  interface Etd {
    "degree.grantor": string;
    "degree.level": string;
    "degree.name": string;
    degreeLevelWithDesc: {
      value: string;
      desc: string;
    };
  }
  
  export interface Asset {
    mms_id: string;
    title: string;
    'title.subtitle'?: string;
    'identifier.doi'?: string;
    'resourcetype.esploro': string;
    creators?: Creator[];
    contributors?: Creator[];
    keywords?: KeywordTranslation[];
    'description.abstract'?: DescriptionTranslation[];
    'subject.esploro': string[];

    'date.degree'?: string;
    'date.published'?: string;
    'date.epublished'?: string;
    'date.copyrighted'?: string;
    'date.presented'?: string;
    'date.posted'?: string;
    'date.available'?: string;
    'date.opening'?: string;
    'date.performance'?: string[];
    'date.valid'?: string;
    'date.issued'?: string;
    'date.renewed'?: string;
    'date.approved'?: string;
    'date.accepted'?: string;
    'date.defense'?: string;
    'date.submitted'?: string;
    'date.application'?: string;
    'date.completed'?: string;
    'date.created'?: string;
    'date.collected'?: string;
    'date.other'?: string[];
    'date.updated'?: string[];

    etd?: Etd;
    
    originalRepository: {
      assetId: string;
    }

    student: {
        name: string;
        department: string;
    }[];
} 

export interface Assets {
  records: Asset[];
  totalRecordCount: number;
}