namespace CodeTable {
  export interface Row {
    code: string,
    description: string
  }
  
  export interface Rows {
    total_rows_count: number,
    row: Row[]
  }
}

namespace MappingTable {
  export interface Row {
    column0: string,
    column1: string,
    enabled: boolean
  }
  
  export interface Rows {
    total_rows_count: number,
    row: Row[]
  }
}

export { CodeTable, MappingTable };