declare module 'flexsearch' {
  export interface Document<T = any> {
    add(doc: T): void
    search(query: string, options?: any): any[]
    remove(id: number | string): void
    update(id: number | string, doc: T): void
  }

  export function Document<T = any>(options: any): Document<T>
}

declare namespace FlexSearch {
  interface Document<T = any> {
    add(doc: T): void
    search(query: string, options?: any): any[]
    remove(id: number | string): void
    update(id: number | string, doc: T): void
  }

  const Document: {
    new <T = any>(options: any): Document<T>
  }
}
