import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResultTransformer, type SearchOrchestratorResult } from '@/lib/search/result-transformer';
import type { AISearchResult } from '@/types/ai';
import type { 
  GmailMessage, 
  GoogleDriveFile, 
  GoogleCalendarEvent,
  AsanaTask,
  QuickBooksCustomer,
  QuickBooksInvoice,
  SlackMessage,
  OutlookMessage,
  OneDriveFile,
} from '@/types/integrations';
import type { ConstructionDocument, RFI } from '@/types/construction';
import type { GoogleContact } from '@/lib/integrations/google/google-people-adapter';

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('ResultTransformer Tests', () => {
  let transformer: ResultTransformer;

  beforeEach(() => {
    transformer = new ResultTransformer();
    vi.clearAllMocks();
  });

  describe('transformResults', () => {
    it('should transform successful search results into AI search results', () => {
      const searchResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'google',
          service: 'gmail',
          data: {
            messages: [
              {
                id: 'msg-1',
                subject: 'Test Email',
                snippet: 'This is a test email',
                body: 'Full email body content',
                threadId: 'thread-1',
                from: 'sender@example.com',
                to: ['recipient@example.com'],
                date: '2024-01-01T10:00:00Z',
                labels: ['INBOX'],
                sizeEstimate: 1024,
              } as GmailMessage,
            ],
          },
        },
        {
          success: true,
          integration: 'slack',
          data: {
            messages: [
              {
                id: 'slack-msg-1',
                text: 'Test Slack message',
                channelId: 'channel-1',
                channelName: 'general',
                user: 'user-1',
                userName: 'John Doe',
                timestamp: '1640995200',
                threadTs: undefined,
              } as SlackMessage,
            ],
          },
        },
        {
          success: false,
          integration: 'asana',
          error: 'API rate limit exceeded',
        },
      ];

      const result = transformer.transformResults(searchResults);

      expect(result).toHaveLength(2); // Only successful results
      expect(result[0].source).toBe('Gmail');
      expect(result[1].source).toBe('Slack');
    });

    it('should handle empty search results', () => {
      const searchResults: SearchOrchestratorResult[] = [];
      const result = transformer.transformResults(searchResults);
      expect(result).toHaveLength(0);
    });

    it('should filter out failed results', () => {
      const searchResults: SearchOrchestratorResult[] = [
        {
          success: false,
          integration: 'google',
          error: 'Authentication failed',
        },
        {
          success: false,
          integration: 'slack',
          error: 'Rate limit exceeded',
        },
      ];

      const result = transformer.transformResults(searchResults);
      expect(result).toHaveLength(0);
    });
  });

  describe('Gmail Results Transformation', () => {
    it('should transform Gmail messages correctly', () => {
      const gmailResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'google',
          service: 'gmail',
          data: {
            messages: [
              {
                id: 'msg-1',
                subject: 'Important Meeting',
                snippet: 'Meeting about project updates',
                body: 'Full meeting details here...',
                threadId: 'thread-1',
                from: 'manager@company.com',
                to: ['team@company.com'],
                date: '2024-01-15T14:30:00Z',
                labels: ['INBOX', 'IMPORTANT'],
                sizeEstimate: 2048,
              } as GmailMessage,
            ],
          },
        },
      ];

      const result = transformer.transformResults(gmailResults);
      const gmailResult = result.find(r => r.source === 'Gmail');

      expect(gmailResult).toBeDefined();
      expect(gmailResult!.id).toBe('gmail-msg-1');
      expect(gmailResult!.title).toBe('Important Meeting');
      expect(gmailResult!.content).toBe('Meeting about project updates');
      expect(gmailResult!.source).toBe('Gmail');
      expect(gmailResult!.integrationType).toBe('google_gmail');
      expect(gmailResult!.metadata.messageId).toBe('msg-1');
      expect(gmailResult!.metadata.from).toBe('manager@company.com');
      expect(gmailResult!.url).toBe('https://mail.google.com/mail/u/0/#inbox/thread-1');
    });

    it('should handle Gmail messages without subject', () => {
      const gmailResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'google',
          service: 'gmail',
          data: {
            messages: [
              {
                id: 'msg-2',
                subject: undefined,
                snippet: undefined,
                body: 'Email without subject',
                threadId: 'thread-2',
                from: 'sender@example.com',
                to: ['recipient@example.com'],
                date: '2024-01-15T14:30:00Z',
                labels: ['INBOX'],
                sizeEstimate: 512,
              } as GmailMessage,
            ],
          },
        },
      ];

      const result = transformer.transformResults(gmailResults);
      const gmailResult = result.find(r => r.source === 'Gmail');

      expect(gmailResult!.title).toBe('No Subject');
      expect(gmailResult!.content).toBe('Email without subject');
    });

    it('should truncate long email body content', () => {
      const longBody = 'a'.repeat(1000);
      const gmailResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'google',
          service: 'gmail',
          data: {
            messages: [
              {
                id: 'msg-3',
                subject: 'Long Email',
                snippet: undefined,
                body: longBody,
                threadId: 'thread-3',
                from: 'sender@example.com',
                to: ['recipient@example.com'],
                date: '2024-01-15T14:30:00Z',
                labels: ['INBOX'],
                sizeEstimate: 1000,
              } as GmailMessage,
            ],
          },
        },
      ];

      const result = transformer.transformResults(gmailResults);
      const gmailResult = result.find(r => r.source === 'Gmail');

      expect(gmailResult!.content).toHaveLength(500);
      expect(gmailResult!.content).toBe(longBody.substring(0, 500));
    });
  });

  describe('Google Drive Results Transformation', () => {
    it('should transform Google Drive files correctly', () => {
      const driveResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'google',
          service: 'drive',
          data: {
            files: [
              {
                id: 'file-1',
                name: 'Project Proposal.pdf',
                mimeType: 'application/pdf',
                size: 1024000, // 1MB
                owners: [{ displayName: 'John Doe', emailAddress: 'john@example.com' }],
                shared: true,
                parents: ['parent-folder-id'],
                webViewLink: 'https://drive.google.com/file/d/file-1/view',
                createdTime: '2024-01-01T10:00:00Z',
                modifiedTime: '2024-01-15T14:30:00Z',
              } as GoogleDriveFile,
            ],
          },
        },
      ];

      const result = transformer.transformResults(driveResults);
      const driveResult = result.find(r => r.source === 'Google Drive');

      expect(driveResult).toBeDefined();
      expect(driveResult!.id).toBe('drive-file-1');
      expect(driveResult!.title).toBe('Project Proposal.pdf');
      expect(driveResult!.content).toBe('File type: application/pdf (1000KB)');
      expect(driveResult!.source).toBe('Google Drive');
      expect(driveResult!.integrationType).toBe('google_drive');
      expect(driveResult!.metadata.fileId).toBe('file-1');
      expect(driveResult!.metadata.mimeType).toBe('application/pdf');
      expect(driveResult!.url).toBe('https://drive.google.com/file/d/file-1/view');
    });

    it('should handle files without size information', () => {
      const driveResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'google',
          service: 'drive',
          data: {
            files: [
              {
                id: 'file-2',
                name: 'Document.docx',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                size: undefined,
                owners: [{ displayName: 'Jane Doe', emailAddress: 'jane@example.com' }],
                shared: false,
                parents: [],
                webViewLink: undefined,
                createdTime: '2024-01-01T10:00:00Z',
                modifiedTime: '2024-01-15T14:30:00Z',
              } as GoogleDriveFile,
            ],
          },
        },
      ];

      const result = transformer.transformResults(driveResults);
      const driveResult = result.find(r => r.source === 'Google Drive');

      expect(driveResult!.content).toBe('File type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(driveResult!.url).toBe('https://drive.google.com/file/d/file-2/view');
    });
  });

  describe('Google Calendar Results Transformation', () => {
    it('should transform calendar events correctly', () => {
      const calendarResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'google',
          service: 'calendar',
          data: {
            events: [
              {
                id: 'event-1',
                summary: 'Team Meeting',
                description: 'Weekly team sync meeting',
                location: 'Conference Room A',
                start: { dateTime: '2024-01-15T10:00:00Z' },
                end: { dateTime: '2024-01-15T11:00:00Z' },
                attendees: [
                  { email: 'john@example.com', displayName: 'John Doe' },
                  { email: 'jane@example.com', displayName: 'Jane Smith' },
                ],
                status: 'confirmed',
                created: '2024-01-01T10:00:00Z',
              } as GoogleCalendarEvent,
            ],
          },
        },
      ];

      const result = transformer.transformResults(calendarResults);
      const calendarResult = result.find(r => r.source === 'Google Calendar');

      expect(calendarResult).toBeDefined();
      expect(calendarResult!.id).toBe('calendar-event-1');
      expect(calendarResult!.title).toBe('Team Meeting');
      expect(calendarResult!.content).toBe('Weekly team sync meeting | Location: Conference Room A');
      expect(calendarResult!.source).toBe('Google Calendar');
      expect(calendarResult!.integrationType).toBe('google_calendar');
      expect(calendarResult!.metadata.eventId).toBe('event-1');
      expect(calendarResult!.metadata.location).toBe('Conference Room A');
      expect(calendarResult!.url).toBe('https://calendar.google.com/calendar/event?eid=event-1');
    });

    it('should handle events without description or location', () => {
      const calendarResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'google',
          service: 'calendar',
          data: {
            events: [
              {
                id: 'event-2',
                summary: 'Quick Call',
                description: undefined,
                location: undefined,
                start: { dateTime: '2024-01-15T15:00:00Z' },
                end: { dateTime: '2024-01-15T15:30:00Z' },
                attendees: [],
                status: 'confirmed',
                created: '2024-01-01T10:00:00Z',
              } as GoogleCalendarEvent,
            ],
          },
        },
      ];

      const result = transformer.transformResults(calendarResults);
      const calendarResult = result.find(r => r.source === 'Google Calendar');

      expect(calendarResult!.content).toBe('No description');
    });
  });

  describe('Slack Results Transformation', () => {
    it('should transform Slack messages correctly', () => {
      const slackResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'slack',
          data: {
            messages: [
              {
                id: 'slack-msg-1',
                text: 'Hey team, great work on the project!',
                channelId: 'C1234567890',
                channelName: 'general',
                user: 'U1234567890',
                userName: 'John Doe',
                timestamp: '1640995200', // 2022-01-01T00:00:00Z
                threadTs: undefined,
              } as SlackMessage,
            ],
          },
        },
      ];

      const result = transformer.transformResults(slackResults);
      const slackResult = result.find(r => r.source === 'Slack');

      expect(slackResult).toBeDefined();
      expect(slackResult!.id).toBe('slack-slack-msg-1');
      expect(slackResult!.title).toBe('#general - John Doe');
      expect(slackResult!.content).toBe('Hey team, great work on the project!');
      expect(slackResult!.source).toBe('Slack');
      expect(slackResult!.integrationType).toBe('slack');
      expect(slackResult!.metadata.messageId).toBe('slack-msg-1');
      expect(slackResult!.metadata.channelName).toBe('general');
      expect(slackResult!.url).toBe('https://slack.com/messages/C1234567890');
      expect(slackResult!.createdAt).toBe('2022-01-01T00:00:00.000Z');
    });

    it('should handle Slack messages with thread timestamps', () => {
      const slackResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'slack',
          data: {
            messages: [
              {
                id: 'slack-msg-2',
                text: 'This is a reply in a thread',
                channelId: 'C1234567890',
                channelName: 'general',
                user: 'U0987654321',
                userName: 'Jane Smith',
                timestamp: '1640995800',
                threadTs: '1640995200',
              } as SlackMessage,
            ],
          },
        },
      ];

      const result = transformer.transformResults(slackResults);
      const slackResult = result.find(r => r.source === 'Slack');

      expect(slackResult!.metadata.threadTs).toBe('1640995200');
    });
  });

  describe('Asana Results Transformation', () => {
    it('should transform Asana tasks correctly', () => {
      const asanaResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'asana',
          data: {
            tasks: [
              {
                id: 'task-1',
                name: 'Complete project documentation',
                notes: 'Need to update all project documentation with latest changes',
                projects: [{ id: 'project-1', name: 'Website Redesign' }],
                assignee: { id: 'user-1', name: 'John Doe' },
                dueOn: '2024-01-20',
                completed: false,
                tags: [{ id: 'tag-1', name: 'documentation' }],
                createdAt: '2024-01-01T10:00:00Z',
              } as AsanaTask,
            ],
          },
        },
      ];

      const result = transformer.transformResults(asanaResults);
      const asanaResult = result.find(r => r.source === 'Asana');

      expect(asanaResult).toBeDefined();
      expect(asanaResult!.id).toBe('asana-task-1');
      expect(asanaResult!.title).toBe('Complete project documentation');
      expect(asanaResult!.content).toBe('Need to update all project documentation with latest changes');
      expect(asanaResult!.source).toBe('Asana');
      expect(asanaResult!.integrationType).toBe('asana');
      expect(asanaResult!.metadata.taskId).toBe('task-1');
      expect(asanaResult!.metadata.assignee).toEqual({ id: 'user-1', name: 'John Doe' });
      expect(asanaResult!.url).toBe('https://app.asana.com/0/project-1/task-1');
    });

    it('should handle tasks without notes', () => {
      const asanaResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'asana',
          data: {
            tasks: [
              {
                id: 'task-2',
                name: 'Simple task',
                notes: undefined,
                projects: [{ id: 'project-2', name: 'Marketing' }],
                assignee: undefined,
                dueOn: undefined,
                completed: false,
                tags: [],
                createdAt: '2024-01-01T10:00:00Z',
              } as AsanaTask,
            ],
          },
        },
      ];

      const result = transformer.transformResults(asanaResults);
      const asanaResult = result.find(r => r.source === 'Asana');

      expect(asanaResult!.content).toBe('No description');
    });
  });

  describe('QuickBooks Results Transformation', () => {
    it('should transform QuickBooks customers correctly', () => {
      const quickbooksResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'quickbooks',
          service: 'customers',
          data: {
            customers: [
              {
                id: 'customer-1',
                name: 'Acme Corporation',
                email: 'contact@acme.com',
                phone: '+1-555-0123',
                balance: 1500.00,
                companyName: 'Acme Corporation',
                createdAt: '2024-01-01T10:00:00Z',
              } as QuickBooksCustomer,
            ],
          },
        },
      ];

      const result = transformer.transformResults(quickbooksResults);
      const qbResult = result.find(r => r.source === 'QuickBooks' && r.id === 'qb-customer-customer-1');

      expect(qbResult).toBeDefined();
      expect(qbResult!.title).toBe('Acme Corporation');
      expect(qbResult!.content).toBe('Email: contact@acme.com | Phone: +1-555-0123');
      expect(qbResult!.source).toBe('QuickBooks');
      expect(qbResult!.integrationType).toBe('quickbooks');
      expect(qbResult!.metadata.customerId).toBe('customer-1');
      expect(qbResult!.metadata.balance).toBe(1500.00);
      expect(qbResult!.url).toBe('https://app.qbo.intuit.com/app/customerdetail?nameId=customer-1');
    });

    it('should transform QuickBooks invoices correctly', () => {
      const quickbooksResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'quickbooks',
          service: 'invoices',
          data: {
            invoices: [
              {
                id: 'invoice-1',
                docNumber: 'INV-001',
                totalAmount: 2500.00,
                balance: 2500.00,
                status: 'Open',
                customerId: 'customer-1',
                customerName: 'Acme Corporation',
                txnDate: '2024-01-15T10:00:00Z',
              } as QuickBooksInvoice,
            ],
          },
        },
      ];

      const result = transformer.transformResults(quickbooksResults);
      const qbResult = result.find(r => r.source === 'QuickBooks' && r.id === 'qb-invoice-invoice-1');

      expect(qbResult).toBeDefined();
      expect(qbResult!.title).toBe('Invoice #INV-001');
      expect(qbResult!.content).toBe('Amount: $2500 | Status: Open');
      expect(qbResult!.metadata.invoiceId).toBe('invoice-1');
      expect(qbResult!.metadata.totalAmount).toBe(2500.00);
      expect(qbResult!.url).toBe('https://app.qbo.intuit.com/app/invoice?txnId=invoice-1');
    });
  });

  describe('Microsoft Results Transformation', () => {
    it('should transform Outlook messages correctly', () => {
      const microsoftResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'microsoft',
          service: 'outlook',
          data: {
            messages: [
              {
                id: 'outlook-msg-1',
                subject: 'Project Update',
                bodyPreview: 'Here is the latest project update...',
                body: 'Full email body content here...',
                from: { emailAddress: { address: 'manager@company.com', name: 'Project Manager' } },
                to: [{ emailAddress: { address: 'team@company.com', name: 'Development Team' } }],
                receivedDateTime: '2024-01-15T14:30:00Z',
                importance: 'normal',
              } as OutlookMessage,
            ],
          },
        },
      ];

      const result = transformer.transformResults(microsoftResults);
      const outlookResult = result.find(r => r.source === 'Microsoft Outlook');

      expect(outlookResult).toBeDefined();
      expect(outlookResult!.id).toBe('outlook-outlook-msg-1');
      expect(outlookResult!.title).toBe('Project Update');
      expect(outlookResult!.content).toBe('Here is the latest project update...');
      expect(outlookResult!.source).toBe('Microsoft Outlook');
      expect(outlookResult!.integrationType).toBe('microsoft_outlook');
      expect(outlookResult!.metadata.messageId).toBe('outlook-msg-1');
      expect(outlookResult!.url).toBe('https://outlook.office.com/mail/deeplink/read/outlook-msg-1');
    });

    it('should transform OneDrive files correctly', () => {
      const microsoftResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'microsoft',
          service: 'onedrive',
          data: {
            files: [
              {
                id: 'onedrive-file-1',
                name: 'Presentation.pptx',
                fileType: 'pptx',
                size: 2048000, // 2MB
                createdBy: { user: { displayName: 'John Doe', email: 'john@example.com' } },
                lastModifiedBy: { user: { displayName: 'Jane Smith', email: 'jane@example.com' } },
                webUrl: 'https://company.sharepoint.com/sites/team/Shared%20Documents/Presentation.pptx',
                createdDateTime: '2024-01-01T10:00:00Z',
                lastModifiedDateTime: '2024-01-15T14:30:00Z',
              } as OneDriveFile,
            ],
          },
        },
      ];

      const result = transformer.transformResults(microsoftResults);
      const onedriveResult = result.find(r => r.source === 'Microsoft OneDrive');

      expect(onedriveResult).toBeDefined();
      expect(onedriveResult!.id).toBe('onedrive-onedrive-file-1');
      expect(onedriveResult!.title).toBe('Presentation.pptx');
      expect(onedriveResult!.content).toBe('File type: pptx (2000KB)');
      expect(onedriveResult!.source).toBe('Microsoft OneDrive');
      expect(onedriveResult!.integrationType).toBe('microsoft_onedrive');
      expect(onedriveResult!.metadata.fileId).toBe('onedrive-file-1');
      expect(onedriveResult!.url).toBe('https://company.sharepoint.com/sites/team/Shared%20Documents/Presentation.pptx');
    });
  });

  describe('Procore Results Transformation', () => {
    it('should transform Procore documents correctly', () => {
      const procoreResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'procore',
          service: 'documents',
          data: {
            documents: [
              {
                id: 'doc-1',
                name: 'Building Plans.pdf',
                projectId: 'project-123',
                type: 'drawings',
                category: 'architectural',
                status: 'approved',
                uploadedBy: { id: 'user-1', name: 'John Doe' },
                uploadedAt: '2024-01-15T10:00:00Z',
              } as ConstructionDocument,
            ],
          },
        },
      ];

      const result = transformer.transformResults(procoreResults);
      const procoreResult = result.find(r => r.source === 'Procore' && r.id === 'procore-doc-doc-1');

      expect(procoreResult).toBeDefined();
      expect(procoreResult!.title).toBe('Building Plans.pdf');
      expect(procoreResult!.content).toBe('Project: project-123 | Type: drawings');
      expect(procoreResult!.source).toBe('Procore');
      expect(procoreResult!.integrationType).toBe('procore');
      expect(procoreResult!.metadata.documentId).toBe('doc-1');
      expect(procoreResult!.metadata.projectId).toBe('project-123');
      expect(procoreResult!.url).toBe('https://app.procore.com/projects/project-123/documents/doc-1');
    });

    it('should transform Procore RFIs correctly', () => {
      const procoreResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'procore',
          service: 'rfis',
          data: {
            rfis: [
              {
                id: 'rfi-1',
                number: 'RFI-001',
                projectId: 'project-123',
                subject: 'Clarification on electrical specifications',
                status: 'pending',
                submittedBy: { id: 'user-2', name: 'Jane Smith' },
                submittedAt: '2024-01-15T14:30:00Z',
              } as RFI,
            ],
          },
        },
      ];

      const result = transformer.transformResults(procoreResults);
      const procoreResult = result.find(r => r.source === 'Procore' && r.id === 'procore-rfi-rfi-1');

      expect(procoreResult).toBeDefined();
      expect(procoreResult!.title).toBe('RFI #RFI-001');
      expect(procoreResult!.content).toBe('Project: project-123 | Subject: Clarification on electrical specifications');
      expect(procoreResult!.source).toBe('Procore');
      expect(procoreResult!.integrationType).toBe('procore');
      expect(procoreResult!.metadata.rfiId).toBe('rfi-1');
      expect(procoreResult!.metadata.number).toBe('RFI-001');
      expect(procoreResult!.url).toBe('https://app.procore.com/projects/project-123/rfis/rfi-1');
    });
  });

  describe('Google People Results Transformation', () => {
    it('should transform Google contacts correctly', () => {
      const peopleResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'google',
          service: 'people',
          data: {
            contacts: [
              {
                id: 'contact-1',
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+1-555-0123',
                organization: 'Acme Corporation',
                jobTitle: 'Software Engineer',
              } as GoogleContact,
            ],
          },
        },
      ];

      const result = transformer.transformResults(peopleResults);
      const peopleResult = result.find(r => r.source === 'Google People');

      expect(peopleResult).toBeDefined();
      expect(peopleResult!.id).toBe('people-contact-1');
      expect(peopleResult!.title).toBe('John Doe');
      expect(peopleResult!.content).toBe('Email: john.doe@example.com | Phone: +1-555-0123 | Acme Corporation - Software Engineer');
      expect(peopleResult!.source).toBe('Google People');
      expect(peopleResult!.integrationType).toBe('google_people');
      expect(peopleResult!.metadata.contactId).toBe('contact-1');
      expect(peopleResult!.url).toBe('https://contacts.google.com/person/contact-1');
    });

    it('should handle contacts with minimal information', () => {
      const peopleResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'google',
          service: 'people',
          data: {
            contacts: [
              {
                id: 'contact-2',
                name: 'Jane Smith',
                email: undefined,
                phone: undefined,
                organization: undefined,
                jobTitle: undefined,
              } as GoogleContact,
            ],
          },
        },
      ];

      const result = transformer.transformResults(peopleResults);
      const peopleResult = result.find(r => r.source === 'Google People');

      expect(peopleResult!.content).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed search results gracefully', () => {
      const malformedResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'google',
          service: 'gmail',
          data: null, // Malformed data
        },
        {
          success: true,
          integration: 'slack',
          data: 'invalid-data-type', // Wrong data type
        },
      ];

      const result = transformer.transformResults(malformedResults);
      expect(result).toHaveLength(0);
    });

    it('should handle missing service data gracefully', () => {
      const resultsWithMissingData: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'google',
          service: 'gmail',
          data: {
            messages: undefined, // Missing messages
          },
        },
      ];

      const result = transformer.transformResults(resultsWithMissingData);
      expect(result).toHaveLength(0);
    });
  });

  describe('Integration Counts', () => {
    it('should log integration counts correctly', () => {
      const searchResults: SearchOrchestratorResult[] = [
        {
          success: true,
          integration: 'google',
          service: 'gmail',
          data: { messages: [{ id: 'msg-1', subject: 'Test', snippet: 'Test', body: 'Test', threadId: 'thread-1', from: 'test@example.com', to: ['test@example.com'], date: '2024-01-01T10:00:00Z', labels: [], sizeEstimate: 100 } as GmailMessage] },
        },
        {
          success: true,
          integration: 'google',
          service: 'gmail',
          data: { messages: [{ id: 'msg-2', subject: 'Test 2', snippet: 'Test 2', body: 'Test 2', threadId: 'thread-2', from: 'test2@example.com', to: ['test2@example.com'], date: '2024-01-01T10:00:00Z', labels: [], sizeEstimate: 100 } as GmailMessage] },
        },
        {
          success: true,
          integration: 'slack',
          data: { messages: [{ id: 'slack-1', text: 'Test', channelId: 'channel-1', channelName: 'general', user: 'user-1', userName: 'John', timestamp: '1640995200', threadTs: undefined } as SlackMessage] },
        },
      ];

      const result = transformer.transformResults(searchResults);
      
      expect(result).toHaveLength(2); // Only 2 unique messages due to deduplication
      expect(result.filter(r => r.integrationType === 'google_gmail')).toHaveLength(1);
      expect(result.filter(r => r.integrationType === 'slack')).toHaveLength(1);
    });
  });
});
