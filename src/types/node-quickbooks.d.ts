declare module 'node-quickbooks' {
  export interface QuickBooksConfig {
    consumerKey: string;
    consumerSecret: string;
    accessToken: string;
    accessTokenSecret: string;
    companyId: string;
    sandbox?: boolean;
  }

  export interface QuickBooksResponse<T> {
    QueryResponse?: {
      [key: string]: T[];
      maxResults?: number;
    };
  }

  export class QuickBooks {
    constructor(
      consumerKey: string,
      consumerSecret: string,
      accessToken: string,
      accessTokenSecret: string,
      companyId: string,
      sandbox?: boolean,
      debug?: boolean,
      minorversion?: string,
      oauthversion?: string,
      baseUrl?: string
    );
    
    findCustomers(query: string, callback: (error: unknown, response: QuickBooksResponse<unknown>) => void): void;
    findInvoices(query: string, callback: (error: unknown, response: QuickBooksResponse<unknown>) => void): void;
    findItems(query: string, callback: (error: unknown, response: QuickBooksResponse<unknown>) => void): void;
    findPayments(query: string, callback: (error: unknown, response: QuickBooksResponse<unknown>) => void): void;
    getCompanyInfo(companyId: string, callback: (error: unknown, companyInfo: QuickBooksResponse<unknown>) => void): void;
  }

  export = QuickBooks;
}
