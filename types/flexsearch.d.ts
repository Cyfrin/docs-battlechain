declare module 'flexsearch' {
  export interface Document<T = any> {
    add(id: number | string, data: T): void
    search(query: string, options?: any): any[]
    remove(id: number | string): void
    update(id: number | string, data: T): void
  }

  export function Document(options: any): Document
}

declare namespace FlexSearch {
  interface Document<T = any> {
    add(id: number | string, data: T): void
    search(query: string, options?: any): any[]
    remove(id: number | string): void
    update(id: number | string, data: T): void
  }
}
