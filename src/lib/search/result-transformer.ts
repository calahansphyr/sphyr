/**
 * Result Transformer Module
 * Transforms integration search results into standardized AI search results
 */

import type { AISearchResult } from '@/types/ai';
import type { 
  GmailMessage, 
  GoogleDriveFile, 
  GoogleCalendarEvent, 
  AsanaTask, 
  QuickBooksCustomer, 
  QuickBooksInvoice, 
  QuickBooksItem, 
  QuickBooksPayment, 
  OutlookMessage, 
  OneDriveFile, 
  OutlookCalendarEvent, 
  WordDocument, 
  ExcelWorkbook,
  SlackMessage
} from '@/types/integrations';
import type { ConstructionDocument, RFI } from '@/types/construction';
import type { GoogleContact } from '@/lib/integrations/google/google-people-adapter';
import { logger } from '@/lib/logger';

export interface SearchOrchestratorResult {
  success: boolean;
  integration: string;
  service?: string;
  data: unknown;
  error?: string;
}

export interface GoogleServiceResult {
  messages?: GmailMessage[];
  files?: GoogleDriveFile[];
  events?: GoogleCalendarEvent[];
  documents?: GoogleDriveFile[];
  spreadsheets?: GoogleDriveFile[];
  contacts?: GoogleContact[];
}

export interface QuickBooksServiceResult {
  customers?: QuickBooksCustomer[];
  invoices?: QuickBooksInvoice[];
  items?: QuickBooksItem[];
  payments?: QuickBooksPayment[];
}

export interface MicrosoftServiceResult {
  messages?: OutlookMessage[];
  files?: OneDriveFile[];
  events?: OutlookCalendarEvent[];
  documents?: WordDocument[];
  workbooks?: ExcelWorkbook[];
}

export interface ProcoreServiceResult {
  documents?: ConstructionDocument[];
  rfis?: RFI[];
}

export class ResultTransformer {
  /**
   * Transform all search results into standardized AI search results
   */
  transformResults(searchResults: SearchOrchestratorResult[]): AISearchResult[] {
    const successfulResults = searchResults.filter(result => result.success);
    const aiSearchResults: AISearchResult[] = [];

    // Transform Google results
    const googleResults = successfulResults.filter(r => r.integration === 'google');
    const [
      gmailResults,
      driveResults,
      calendarResults,
      docsResults,
      sheetsResults,
      peopleResults,
    ] = this.extractGoogleResults(googleResults);

    // Transform other integration results
    const slackResults = successfulResults.find(r => r.integration === 'slack');
    const asanaResults = successfulResults.find(r => r.integration === 'asana');
    const quickbooksResults = this.extractQuickBooksResults(successfulResults.filter(r => r.integration === 'quickbooks'));
    const microsoftResults = this.extractMicrosoftResults(successfulResults.filter(r => r.integration === 'microsoft'));
    const procoreResults = this.extractProcoreResults(successfulResults.filter(r => r.integration === 'procore'));

    // Transform each type of result
    aiSearchResults.push(
      ...this.transformGmailResults(gmailResults),
      ...this.transformDriveResults(driveResults),
      ...this.transformCalendarResults(calendarResults),
      ...this.transformDocsResults(docsResults),
      ...this.transformSheetsResults(sheetsResults),
      ...this.transformPeopleResults(peopleResults),
      ...this.transformSlackResults(slackResults),
      ...this.transformAsanaResults(asanaResults),
      ...this.transformQuickBooksResults(quickbooksResults),
      ...this.transformMicrosoftResults(microsoftResults),
      ...this.transformProcoreResults(procoreResults)
    );

    logger.info('Results transformed successfully', {
      totalResults: aiSearchResults.length,
      integrationCounts: this.getIntegrationCounts(aiSearchResults),
    });

    return aiSearchResults;
  }

  /**
   * Extract Google service results
   */
  private extractGoogleResults(googleResults: SearchOrchestratorResult[]): GoogleServiceResult[] {
    const serviceNames = ['gmail', 'drive', 'calendar', 'docs', 'sheets', 'people'];
    const fallbackResults: GoogleServiceResult[] = [
      { messages: [] },
      { files: [] },
      { events: [] },
      { documents: [] },
      { spreadsheets: [] },
      { contacts: [] }
    ];
    
    return serviceNames.map(service => {
      const result = googleResults.find(r => r.service === service);
      return result ? (result.data as GoogleServiceResult) : fallbackResults[serviceNames.indexOf(service)];
    });
  }

  /**
   * Extract QuickBooks results
   */
  private extractQuickBooksResults(quickbooksResults: SearchOrchestratorResult[]): QuickBooksServiceResult {
    const serviceNames = ['customers', 'invoices', 'items', 'payments'];
    const result: QuickBooksServiceResult = { customers: [], invoices: [], items: [], payments: [] };
    
    serviceNames.forEach(service => {
      const searchResult = quickbooksResults.find(r => r.service === service);
      if (searchResult) {
        const data = searchResult.data as QuickBooksServiceResult;
        if (service === 'customers' && data.customers) result.customers = data.customers;
        if (service === 'invoices' && data.invoices) result.invoices = data.invoices;
        if (service === 'items' && data.items) result.items = data.items;
        if (service === 'payments' && data.payments) result.payments = data.payments;
      }
    });
    
    return result;
  }

  /**
   * Extract Microsoft results
   */
  private extractMicrosoftResults(microsoftResults: SearchOrchestratorResult[]): SearchOrchestratorResult[] {
    return microsoftResults;
  }

  /**
   * Extract Procore results
   */
  private extractProcoreResults(procoreResults: SearchOrchestratorResult[]): SearchOrchestratorResult[] {
    return procoreResults;
  }

  /**
   * Transform Gmail results
   */
  private transformGmailResults(gmailResults: GoogleServiceResult): AISearchResult[] {
    if (!gmailResults?.messages) return [];
    
    return gmailResults.messages.map((message: GmailMessage) => ({
      id: `gmail-${message.id}`,
      title: message.subject || 'No Subject',
      content: message.snippet || message.body.substring(0, 500),
      source: 'Gmail',
      integrationType: 'google_gmail' as const,
      metadata: {
        messageId: message.id,
        threadId: message.threadId,
        from: message.from,
        to: message.to,
        date: message.date,
        labels: message.labels,
        sizeEstimate: message.sizeEstimate,
      },
      url: `https://mail.google.com/mail/u/0/#inbox/${message.threadId}`,
      createdAt: message.date,
    }));
  }

  /**
   * Transform Google Drive results
   */
  private transformDriveResults(driveResults: GoogleServiceResult): AISearchResult[] {
    if (!driveResults?.files) return [];
    
    return driveResults.files.map((file: GoogleDriveFile) => ({
      id: `drive-${file.id}`,
      title: file.name,
      content: `File type: ${file.mimeType}${file.size ? ` (${Math.round(file.size / 1024)}KB)` : ''}`,
      source: 'Google Drive',
      integrationType: 'google_drive' as const,
      metadata: {
        fileId: file.id,
        mimeType: file.mimeType,
        size: file.size,
        owners: file.owners,
        shared: file.shared,
        parents: file.parents,
      },
      url: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      createdAt: file.createdTime,
    }));
  }

  /**
   * Transform Google Calendar results
   */
  private transformCalendarResults(calendarResults: GoogleServiceResult): AISearchResult[] {
    if (!calendarResults?.events) return [];
    
    return calendarResults.events.map((event: GoogleCalendarEvent) => ({
      id: `calendar-${event.id}`,
      title: event.summary,
      content: `${event.description || 'No description'}${event.location ? ` | Location: ${event.location}` : ''}`,
      source: 'Google Calendar',
      integrationType: 'google_calendar' as const,
      metadata: {
        eventId: event.id,
        start: event.start,
        end: event.end,
        attendees: event.attendees,
        location: event.location,
        status: event.status,
      },
      url: `https://calendar.google.com/calendar/event?eid=${event.id}`,
      createdAt: event.created,
    }));
  }

  /**
   * Transform Google Docs results
   */
  private transformDocsResults(docsResults: GoogleServiceResult): AISearchResult[] {
    if (!docsResults?.documents) return [];
    
    return docsResults.documents.map((doc: GoogleDriveFile) => ({
      id: `docs-${doc.id}`,
      title: doc.name,
      content: `Google Doc - Last modified: ${new Date(doc.modifiedTime).toLocaleDateString()}`,
      source: 'Google Docs',
      integrationType: 'google_docs' as const,
      metadata: {
        documentId: doc.id,
        mimeType: doc.mimeType,
        size: doc.size,
        owners: doc.owners,
        shared: doc.shared,
        parents: doc.parents,
      },
      url: doc.webViewLink || `https://docs.google.com/document/d/${doc.id}/edit`,
      createdAt: doc.createdTime,
    }));
  }

  /**
   * Transform Google Sheets results
   */
  private transformSheetsResults(sheetsResults: GoogleServiceResult): AISearchResult[] {
    if (!sheetsResults?.spreadsheets) return [];
    
    return sheetsResults.spreadsheets.map((sheet: GoogleDriveFile) => ({
      id: `sheets-${sheet.id}`,
      title: sheet.name,
      content: `Google Sheet - Last modified: ${new Date(sheet.modifiedTime).toLocaleDateString()}`,
      source: 'Google Sheets',
      integrationType: 'google_sheets' as const,
      metadata: {
        spreadsheetId: sheet.id,
        mimeType: sheet.mimeType,
        size: sheet.size,
        owners: sheet.owners,
        shared: sheet.shared,
        parents: sheet.parents,
      },
      url: sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`,
      createdAt: sheet.createdTime,
    }));
  }

  /**
   * Transform Google People results
   */
  private transformPeopleResults(peopleResults: GoogleServiceResult): AISearchResult[] {
    if (!peopleResults?.contacts) return [];
    
    return peopleResults.contacts.map((contact: GoogleContact) => ({
      id: `people-${contact.id}`,
      title: contact.name,
      content: `${contact.email ? `Email: ${contact.email}` : ''}${contact.phone ? ` | Phone: ${contact.phone}` : ''}${contact.organization ? ` | ${contact.organization}` : ''}${contact.jobTitle ? ` - ${contact.jobTitle}` : ''}`,
      source: 'Google People',
      integrationType: 'google_people' as const,
      metadata: {
        contactId: contact.id,
        email: contact.email,
        phone: contact.phone,
        organization: contact.organization,
        jobTitle: contact.jobTitle,
      },
      url: `https://contacts.google.com/person/${contact.id}`,
      createdAt: new Date().toISOString(),
    }));
  }

  /**
   * Transform Slack results
   */
  private transformSlackResults(slackResults: SearchOrchestratorResult | undefined): AISearchResult[] {
    if (!slackResults?.data || typeof slackResults.data !== 'object') return [];
    
    const data = slackResults.data as { messages?: SlackMessage[] };
    if (!data.messages) return [];
    
    return data.messages.map((message: SlackMessage) => ({
      id: `slack-${message.id}`,
      title: `#${message.channelName} - ${message.userName}`,
      content: message.text,
      source: 'Slack',
      integrationType: 'slack' as const,
      metadata: {
        messageId: message.id,
        channelId: message.channelId,
        channelName: message.channelName,
        user: message.user,
        userName: message.userName,
        timestamp: message.timestamp,
        threadTs: message.threadTs,
      },
      url: `https://slack.com/messages/${message.channelId}`,
      createdAt: new Date(parseInt(message.timestamp) * 1000).toISOString(),
    }));
  }

  /**
   * Transform Asana results
   */
  private transformAsanaResults(asanaResults: SearchOrchestratorResult | undefined): AISearchResult[] {
    if (!asanaResults?.data || typeof asanaResults.data !== 'object') return [];
    
    const data = asanaResults.data as { tasks?: AsanaTask[] };
    if (!data.tasks) return [];
    
    return data.tasks.map((task: AsanaTask) => ({
      id: `asana-${task.id}`,
      title: task.name,
      content: task.notes || 'No description',
      source: 'Asana',
      integrationType: 'asana' as const,
      metadata: {
        taskId: task.id,
        projects: task.projects,
        assignee: task.assignee,
        dueOn: task.dueOn,
        completed: task.completed,
        tags: task.tags,
      },
      url: `https://app.asana.com/0/${task.projects[0]?.id || 'unknown'}/${task.id}`,
      createdAt: task.createdAt,
    }));
  }

  /**
   * Transform QuickBooks results
   */
  private transformQuickBooksResults(quickbooksResults: QuickBooksServiceResult): AISearchResult[] {
    const results: AISearchResult[] = [];
    
    // Transform customers
    if (quickbooksResults.customers) {
      results.push(...quickbooksResults.customers.map((customer: QuickBooksCustomer) => ({
        id: `qb-customer-${customer.id}`,
        title: customer.name,
        content: `${customer.email ? `Email: ${customer.email}` : ''}${customer.phone ? ` | Phone: ${customer.phone}` : ''}`,
        source: 'QuickBooks',
        integrationType: 'quickbooks' as const,
        metadata: {
          customerId: customer.id,
          email: customer.email,
          phone: customer.phone,
          balance: customer.balance,
          companyName: customer.companyName,
        },
        url: `https://app.qbo.intuit.com/app/customerdetail?nameId=${customer.id}`,
        createdAt: customer.createdAt,
      })));
    }

    // Transform invoices
    if (quickbooksResults.invoices) {
      results.push(...quickbooksResults.invoices.map((invoice: QuickBooksInvoice) => ({
        id: `qb-invoice-${invoice.id}`,
        title: `Invoice #${invoice.docNumber}`,
        content: `Amount: $${invoice.totalAmount} | Status: ${invoice.status}`,
        source: 'QuickBooks',
        integrationType: 'quickbooks' as const,
        metadata: {
          invoiceId: invoice.id,
          docNumber: invoice.docNumber,
          totalAmount: invoice.totalAmount,
          balance: invoice.balance,
          status: invoice.status,
          customerId: invoice.customerId,
          customerName: invoice.customerName,
        },
        url: `https://app.qbo.intuit.com/app/invoice?txnId=${invoice.id}`,
        createdAt: invoice.txnDate,
      })));
    }

    return results;
  }

  /**
   * Transform Microsoft results
   */
  private transformMicrosoftResults(microsoftResults: SearchOrchestratorResult[]): AISearchResult[] {
    const results: AISearchResult[] = [];
    
    // Extract individual Microsoft results
    const microsoftOutlookResults = microsoftResults.find(r => r.service === 'outlook')?.data as { messages?: OutlookMessage[] } || { messages: [] };
    const microsoftOneDriveResults = microsoftResults.find(r => r.service === 'onedrive')?.data as { files?: OneDriveFile[] } || { files: [] };
    // TODO: Implement calendar, word, and excel result transformations
    // const microsoftCalendarResults = microsoftResults.find(r => r.service === 'calendar')?.data as { events?: OutlookCalendarEvent[] } || { events: [] };
    // const microsoftWordResults = microsoftResults.find(r => r.service === 'word')?.data as { documents?: WordDocument[] } || { documents: [] };
    // const microsoftExcelResults = microsoftResults.find(r => r.service === 'excel')?.data as { workbooks?: ExcelWorkbook[] } || { workbooks: [] };

    // Transform Outlook messages
    if (microsoftOutlookResults.messages) {
      results.push(...microsoftOutlookResults.messages.map((message: OutlookMessage) => ({
        id: `outlook-${message.id}`,
        title: message.subject || 'No Subject',
        content: message.bodyPreview || message.body.substring(0, 500),
        source: 'Microsoft Outlook',
        integrationType: 'microsoft_outlook' as const,
        metadata: {
          messageId: message.id,
          from: message.from,
          to: message.to,
          receivedDateTime: message.receivedDateTime,
          importance: message.importance,
        },
        url: `https://outlook.office.com/mail/deeplink/read/${message.id}`,
        createdAt: message.receivedDateTime,
      })));
    }

    // Transform OneDrive files
    if (microsoftOneDriveResults.files) {
      results.push(...microsoftOneDriveResults.files.map((file: OneDriveFile) => ({
        id: `onedrive-${file.id}`,
        title: file.name,
        content: `File type: ${file.fileType}${file.size ? ` (${Math.round(file.size / 1024)}KB)` : ''}`,
        source: 'Microsoft OneDrive',
        integrationType: 'microsoft_onedrive' as const,
        metadata: {
          fileId: file.id,
          fileType: file.fileType,
          size: file.size,
          createdBy: file.createdBy,
          lastModifiedBy: file.lastModifiedBy,
        },
        url: file.webUrl || `https://onedrive.live.com/?id=${file.id}`,
        createdAt: file.createdDateTime,
      })));
    }

    return results;
  }

  /**
   * Transform Procore results
   */
  private transformProcoreResults(procoreResults: SearchOrchestratorResult[]): AISearchResult[] {
    const results: AISearchResult[] = [];
    
    // Extract individual Procore results
    const procoreDocumentResults = procoreResults.find(r => r.service === 'documents')?.data as { documents?: ConstructionDocument[] } || { documents: [] };
    const procoreRfiResults = procoreResults.find(r => r.service === 'rfis')?.data as { rfis?: RFI[] } || { rfis: [] };

    // Transform Procore documents
    if (procoreDocumentResults.documents) {
      results.push(...procoreDocumentResults.documents.map((document: ConstructionDocument) => ({
        id: `procore-doc-${document.id}`,
        title: document.name,
        content: `Project: ${document.projectId} | Type: ${document.type}`,
        source: 'Procore',
        integrationType: 'procore' as const,
        metadata: {
          documentId: document.id,
          projectId: document.projectId,
          type: document.type,
          category: document.category,
          status: document.status,
          uploadedBy: document.uploadedBy,
        },
        url: `https://app.procore.com/projects/${document.projectId}/documents/${document.id}`,
        createdAt: document.uploadedAt,
      })));
    }

    // Transform Procore RFIs
    if (procoreRfiResults.rfis) {
      results.push(...procoreRfiResults.rfis.map((rfi: RFI) => ({
        id: `procore-rfi-${rfi.id}`,
        title: `RFI #${rfi.number}`,
        content: `Project: ${rfi.projectId} | Subject: ${rfi.subject}`,
        source: 'Procore',
        integrationType: 'procore' as const,
        metadata: {
          rfiId: rfi.id,
          number: rfi.number,
          projectId: rfi.projectId,
          subject: rfi.subject,
          status: rfi.status,
          submittedBy: rfi.submittedBy,
        },
        url: `https://app.procore.com/projects/${rfi.projectId}/rfis/${rfi.id}`,
        createdAt: rfi.submittedAt,
      })));
    }

    return results;
  }

  /**
   * Get integration counts for logging
   */
  private getIntegrationCounts(results: AISearchResult[]): Record<string, number> {
    const counts: Record<string, number> = {};
    results.forEach(result => {
      counts[result.integrationType] = (counts[result.integrationType] || 0) + 1;
    });
    return counts;
  }
}
