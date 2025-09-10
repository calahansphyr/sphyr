/**
 * QuickBooks Integration Adapter
 * Implements the Adapter Pattern to standardize QuickBooks API interactions
 */

import QuickBooks, { QuickBooksResponse } from 'node-quickbooks';
import { IntegrationError, toSphyrError } from '@/lib/errors';
import type { 
  QuickBooksCustomer, 
  QuickBooksInvoice, 
  QuickBooksItem, 
  QuickBooksPayment,
  QuickBooksCompanyInfo,
  QuickBooksApiCustomer,
  QuickBooksApiInvoice,
  QuickBooksApiItem,
  QuickBooksApiPayment
} from '@/types/integrations';

export interface QuickBooksAdapterConfig {
  credentials: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    environment: 'sandbox' | 'production';
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    companyId: string;
  };
}

export interface QuickBooksSearchOptions {
  query: string;
  limit?: number;
  entityType?: 'Customer' | 'Invoice' | 'Item' | 'Payment';
  startPosition?: number;
}

export interface QuickBooksSearchResult {
  customers?: QuickBooksCustomer[];
  invoices?: QuickBooksInvoice[];
  items?: QuickBooksItem[];
  payments?: QuickBooksPayment[];
  totalCount: number;
  hasMore: boolean;
}

export class QuickBooksAdapter {
  private qbo!: QuickBooks;
  private config: QuickBooksAdapterConfig;

  constructor(config: QuickBooksAdapterConfig) {
    this.config = config;
    this.initializeQuickBooksClient();
  }

  /**
   * Initialize the QuickBooks client with OAuth2 credentials
   */
  private initializeQuickBooksClient(): void {
    try {
      this.qbo = new QuickBooks(
        this.config.credentials.clientId,
        this.config.credentials.clientSecret,
        this.config.tokens.accessToken,
        '', // no token secret for OAuth 2.0
        this.config.tokens.companyId,
        this.config.credentials.environment === 'production',
        false, // enable debug
        undefined, // minor version
        '2.0', // oauth version
        this.config.tokens.refreshToken
      );
    } catch (error) {
      throw new IntegrationError(
        'QuickBooks',
        'Failed to initialize QuickBooks client',
        {
          originalError: error as Error,
          operation: 'initializeQuickBooksClient',
        }
      );
    }
  }

  /**
   * Search for customers in QuickBooks
   */
  async searchCustomers(options: QuickBooksSearchOptions): Promise<{ customers: QuickBooksCustomer[]; totalCount: number; hasMore: boolean }> {
    try {
      const { query, limit = 10, startPosition = 1 } = options;

      const searchQuery = `SELECT * FROM Customer WHERE Name LIKE '%${query.trim()}%' OR DisplayName LIKE '%${query.trim()}%' OR CompanyName LIKE '%${query.trim()}%' OR Email LIKE '%${query.trim()}%' ORDER BY Name STARTPOSITION ${startPosition} MAXRESULTS ${limit}`;

      return new Promise((resolve, reject) => {
        this.qbo.findCustomers(searchQuery, (error: unknown, customers: { QueryResponse?: { Customer?: QuickBooksApiCustomer[]; maxResults?: number } }) => {
          if (error) {
            reject(error);
          } else {
            const customerList = customers.QueryResponse?.Customer || [];
            resolve({
              customers: customerList.map((customer: QuickBooksApiCustomer) => this.parseQuickBooksCustomer(customer)),
              totalCount: customers.QueryResponse?.maxResults || customerList.length,
              hasMore: customerList.length === limit,
            });
          }
        });
      });

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'QuickBooks',
        operation: 'searchCustomers',
        query: options.query,
      });

      throw new IntegrationError(
        'QuickBooks',
        `Failed to search customers: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'searchCustomers',
          query: options.query,
        }
      );
    }
  }

  /**
   * Search for invoices in QuickBooks
   */
  async searchInvoices(options: QuickBooksSearchOptions): Promise<{ invoices: QuickBooksInvoice[]; totalCount: number; hasMore: boolean }> {
    try {
      const { query, limit = 10, startPosition = 1 } = options;

      const searchQuery = `SELECT * FROM Invoice WHERE DocNumber LIKE '%${query.trim()}%' OR CustomerRef.value LIKE '%${query.trim()}%' ORDER BY TxnDate DESC STARTPOSITION ${startPosition} MAXRESULTS ${limit}`;

      return new Promise((resolve, reject) => {
        this.qbo.findInvoices(searchQuery, (error: unknown, invoices: { QueryResponse?: { Invoice?: QuickBooksApiInvoice[]; maxResults?: number } }) => {
          if (error) {
            reject(error);
          } else {
            const invoiceList = invoices.QueryResponse?.Invoice || [];
            resolve({
              invoices: invoiceList.map((invoice: QuickBooksApiInvoice) => this.parseQuickBooksInvoice(invoice)),
              totalCount: invoices.QueryResponse?.maxResults || invoiceList.length,
              hasMore: invoiceList.length === limit,
            });
          }
        });
      });

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'QuickBooks',
        operation: 'searchInvoices',
        query: options.query,
      });

      throw new IntegrationError(
        'QuickBooks',
        `Failed to search invoices: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'searchInvoices',
          query: options.query,
        }
      );
    }
  }

  /**
   * Search for items in QuickBooks
   */
  async searchItems(options: QuickBooksSearchOptions): Promise<{ items: QuickBooksItem[]; totalCount: number; hasMore: boolean }> {
    try {
      const { query, limit = 10, startPosition = 1 } = options;

      const searchQuery = `SELECT * FROM Item WHERE Name LIKE '%${query.trim()}%' OR SKU LIKE '%${query.trim()}%' OR Description LIKE '%${query.trim()}%' ORDER BY Name STARTPOSITION ${startPosition} MAXRESULTS ${limit}`;

      return new Promise((resolve, reject) => {
        this.qbo.findItems(searchQuery, (error: unknown, items: { QueryResponse?: { Item?: QuickBooksApiItem[]; maxResults?: number } }) => {
          if (error) {
            reject(error);
          } else {
            const itemList = items.QueryResponse?.Item || [];
            resolve({
              items: itemList.map((item: QuickBooksApiItem) => this.parseQuickBooksItem(item)),
              totalCount: items.QueryResponse?.maxResults || itemList.length,
              hasMore: itemList.length === limit,
            });
          }
        });
      });

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'QuickBooks',
        operation: 'searchItems',
        query: options.query,
      });

      throw new IntegrationError(
        'QuickBooks',
        `Failed to search items: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'searchItems',
          query: options.query,
        }
      );
    }
  }

  /**
   * Search for payments in QuickBooks
   */
  async searchPayments(options: QuickBooksSearchOptions): Promise<{ payments: QuickBooksPayment[]; totalCount: number; hasMore: boolean }> {
    try {
      const { query, limit = 10, startPosition = 1 } = options;

      const searchQuery = `SELECT * FROM Payment WHERE CustomerRef.value LIKE '%${query.trim()}%' ORDER BY TxnDate DESC STARTPOSITION ${startPosition} MAXRESULTS ${limit}`;

      return new Promise((resolve, reject) => {
        this.qbo.findPayments(searchQuery, (error: unknown, payments: { QueryResponse?: { Payment?: QuickBooksApiPayment[]; maxResults?: number } }) => {
          if (error) {
            reject(error);
          } else {
            const paymentList = payments.QueryResponse?.Payment || [];
            resolve({
              payments: paymentList.map((payment: QuickBooksApiPayment) => this.parseQuickBooksPayment(payment)),
              totalCount: payments.QueryResponse?.maxResults || paymentList.length,
              hasMore: paymentList.length === limit,
            });
          }
        });
      });

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'QuickBooks',
        operation: 'searchPayments',
        query: options.query,
      });

      throw new IntegrationError(
        'QuickBooks',
        `Failed to search payments: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'searchPayments',
          query: options.query,
        }
      );
    }
  }

  /**
   * Get company information
   */
  async getCompanyInfo(): Promise<{ id: string; name: string; legalName?: string }> {
    try {
      return new Promise((resolve, reject) => {
        this.qbo.getCompanyInfo(this.config.tokens.companyId, (error: unknown, companyInfo: QuickBooksResponse<unknown>) => {
          if (error) {
            reject(error);
          } else {
            const company = (companyInfo.QueryResponse as { CompanyInfo?: QuickBooksCompanyInfo[] })?.CompanyInfo?.[0];
            resolve({
              id: company?.Id || this.config.tokens.companyId,
              name: company?.CompanyName || 'Unknown Company',
              legalName: company?.LegalName,
            });
          }
        });
      });

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'QuickBooks',
        operation: 'getCompanyInfo',
        companyId: this.config.tokens.companyId,
      });

      throw new IntegrationError(
        'QuickBooks',
        `Failed to get company info: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getCompanyInfo',
          companyId: this.config.tokens.companyId,
        }
      );
    }
  }

  /**
   * Parse raw QuickBooks customer data into our standardized format
   */
  private parseQuickBooksCustomer(customer: QuickBooksApiCustomer): QuickBooksCustomer {
    return {
      id: customer.Id || '',
      name: customer.DisplayName || customer.FullyQualifiedName || 'Unknown Customer',
      companyName: customer.CompanyName || undefined,
      email: customer.PrimaryEmailAddr?.Address || undefined,
      phone: customer.PrimaryPhone?.FreeFormNumber || undefined,
      billingAddress: customer.BillAddr ? {
        line1: customer.BillAddr.Line1 || '',
        line2: customer.BillAddr.Line2 || undefined,
        city: customer.BillAddr.City || '',
        countrySubDivisionCode: customer.BillAddr.CountrySubDivisionCode || '',
        postalCode: customer.BillAddr.PostalCode || '',
        country: customer.BillAddr.Country || '',
      } : undefined,
      balance: customer.Balance || 0,
      createdAt: customer.MetaData?.CreateTime || new Date().toISOString(),
      updatedAt: customer.MetaData?.LastUpdatedTime || new Date().toISOString(),
    };
  }

  /**
   * Parse raw QuickBooks invoice data into our standardized format
   */
  private parseQuickBooksInvoice(invoice: QuickBooksApiInvoice): QuickBooksInvoice {
    return {
      id: invoice.Id || '',
      docNumber: invoice.DocNumber || '',
      customerId: invoice.CustomerRef?.value || '',
      customerName: invoice.CustomerRef?.name || '',
      totalAmount: invoice.TotalAmt || 0,
      balance: invoice.Balance || 0,
      dueDate: invoice.DueDate || undefined,
      txnDate: invoice.TxnDate || new Date().toISOString(),
      status: invoice.EmailStatus || 'Draft',
      lineItems: invoice.Line?.map((line) => ({
        id: line.Id || '',
        description: line.Description || '',
        amount: line.Amount || 0,
        quantity: line.SalesItemLineDetail?.Qty || 1,
        unitPrice: line.SalesItemLineDetail?.UnitPrice || 0,
      })) || [],
      createdAt: invoice.MetaData?.CreateTime || new Date().toISOString(),
      updatedAt: invoice.MetaData?.LastUpdatedTime || new Date().toISOString(),
    };
  }

  /**
   * Parse raw QuickBooks item data into our standardized format
   */
  private parseQuickBooksItem(item: QuickBooksApiItem): QuickBooksItem {
    return {
      id: item.Id || '',
      name: item.Name || '',
      sku: item.Sku || undefined,
      description: item.Description || undefined,
      type: item.Type || 'Service',
      unitPrice: item.UnitPrice || 0,
      taxable: item.Taxable !== false,
      active: item.Active !== false,
      incomeAccountRef: item.IncomeAccountRef?.value || undefined,
      expenseAccountRef: item.ExpenseAccountRef?.value || undefined,
      createdAt: item.MetaData?.CreateTime || new Date().toISOString(),
      updatedAt: item.MetaData?.LastUpdatedTime || new Date().toISOString(),
    };
  }

  /**
   * Parse raw QuickBooks payment data into our standardized format
   */
  private parseQuickBooksPayment(payment: QuickBooksApiPayment): QuickBooksPayment {
    return {
      id: payment.Id || '',
      customerId: payment.CustomerRef?.value || '',
      customerName: payment.CustomerRef?.name || '',
      totalAmount: payment.TotalAmt || 0,
      txnDate: payment.TxnDate || new Date().toISOString(),
      paymentMethod: payment.PaymentMethodRef?.name || 'Unknown',
      paymentType: 'Cash', // Default payment type since PaymentType is not available in API
      lineItems: payment.Line?.map((line) => ({
        id: line.Id || '',
        amount: line.Amount || 0,
        linkedTxn: line.LinkedTxn?.[0] ? {
          txnId: line.LinkedTxn[0].TxnId || '',
          txnType: line.LinkedTxn[0].TxnType || '',
        } : undefined,
      })) || [],
      createdAt: payment.MetaData?.CreateTime || new Date().toISOString(),
      updatedAt: payment.MetaData?.LastUpdatedTime || new Date().toISOString(),
    };
  }

  /**
   * Test the connection to QuickBooks
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getCompanyInfo();
      return true;
    } catch {
      return false;
    }
  }
}
