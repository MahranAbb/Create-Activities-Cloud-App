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
    identifier_doi?: string;
    'resourcetype.esploro': string;
    creators?: Creator[];
    contributors?: Creator[];
    keywords?: string[];
    keywordsTranslations?: KeywordTranslation[];
    'description.abstract'?: string;
    descriptionAbstractTranslations?: DescriptionTranslation[];
    'subject.esploro': string[];

    'date.presented'?: string;
    'date.published'?: string;
    'date.accepted'?: string;
    'date.available'?: string;
    'date.copyrighted'?: string;
    'date.created'?: string;
    'date.submitted'?: string;
    'date.posted'?: string;
    'date.epublished'?: string;
    'date.degree'?: string;

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