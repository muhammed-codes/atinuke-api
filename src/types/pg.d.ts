declare module 'pg' {
  export class Pool {
    constructor(config?: any);
    connect(): Promise<any>;
    query(text: string, values?: any[]): Promise<any>;
    end(): Promise<void>;
  }
}
