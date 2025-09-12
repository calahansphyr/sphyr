/**
 * Type definitions for all third-party integrations
 */

export type IntegrationType = 
  | 'google_gmail'
  | 'google_drive'
  | 'google_calendar'
  | 'asana'
  | 'hubspot'
  | 'quickbooks'
  | 'slack'
  | 'procore'
  | 'buildertrend'
  | 'microsoft_outlook';

export type IntegrationStatus = 
  | 'active'
  | 'inactive'
  | 'error'
  | 'pending';

export interface Integration {
  id: string;
  organizationId: string;
  userId: string;
  type: IntegrationType;
  status: IntegrationStatus;
  name: string;
  description?: string;
  config: Record<string, unknown>;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthToken {
  id: string;
  integrationId: string;
  userId: string;
  organizationId: string;
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt?: string;
  scope?: string;
  createdAt: string;
  updatedAt: string;
}

// Google Workspace types
export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  cc?: string[];
  bcc?: string[];
  date: string;
  snippet: string;
  body: string;
  attachments?: GmailAttachment[];
  labels: string[];
  sizeEstimate: number;
}

export interface GmailSearchOptions {
  query: string;
  limit?: number;
  pageToken?: string;
}

export interface GmailSearchResult {
  messages: GmailMessage[];
  nextPageToken?: string;
  totalCount: number;
}

export interface GmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  downloadUrl?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
  owners: GoogleDriveOwner[];
  shared: boolean;
}

export interface GoogleDriveOwner {
  displayName: string;
  emailAddress: string;
  photoLink?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: GoogleCalendarDateTime;
  end: GoogleCalendarDateTime;
  attendees?: GoogleCalendarAttendee[];
  location?: string;
  status: string;
  created: string;
  updated: string;
}

export interface GoogleCalendarDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface GoogleCalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus: string;
}

// Asana types
export interface AsanaTask {
  id: string;
  name: string;
  notes?: string;
  completed: boolean;
  dueOn?: string;
  assignee?: AsanaUser;
  projects: AsanaProject[];
  tags: AsanaTag[];
  createdAt: string;
  modifiedAt: string;
}

export interface AsanaProject {
  id: string;
  name: string;
  color?: string;
  notes?: string;
  archived: boolean;
  createdAt: string;
  modifiedAt: string;
}

export interface AsanaUser {
  id: string;
  name: string;
  email?: string;
  photo?: string;
}

export interface AsanaTag {
  id: string;
  name: string;
  color?: string;
}

// HubSpot types
export interface HubSpotContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  createdAt: string;
  updatedAt: string;
  properties: Record<string, unknown>;
}

export interface HubSpotCompany {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  properties: Record<string, unknown>;
}

// QuickBooks types
export interface QuickBooksCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  billingAddress?: QuickBooksAddress;
  shippingAddress?: QuickBooksAddress;
  balance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuickBooksAddress {
  line1: string;
  line2?: string;
  city: string;
  countrySubDivisionCode: string;
  postalCode: string;
  country: string;
}

export interface QuickBooksInvoice {
  id: string;
  docNumber: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  balance: number;
  dueDate?: string;
  txnDate: string;
  status: string;
  lineItems: Array<{
    id: string;
    description: string;
    amount: number;
    quantity: number;
    unitPrice: number;
    itemRef?: {
      value: string;
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface QuickBooksItem {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  type: string;
  unitPrice: number;
  taxable: boolean;
  active: boolean;
  incomeAccountRef?: string;
  expenseAccountRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuickBooksPayment {
  id: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  txnDate: string;
  paymentMethod: string;
  paymentType: string;
  lineItems: Array<{
    id: string;
    amount: number;
    linkedTxn?: {
      txnId: string;
      txnType: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

// Slack types
export interface SlackMessage {
  id: string;
  channelId: string;
  channelName: string;
  text: string;
  user: string;
  userName: string;
  timestamp: string;
  threadTs?: string;
  attachments?: SlackAttachment[];
}

export interface SlackAttachment {
  title?: string;
  titleLink?: string;
  text?: string;
  fallback: string;
  color?: string;
  fields?: SlackField[];
}

export interface SlackField {
  title: string;
  value: string;
  short: boolean;
}

export interface SlackChannel {
  id: string;
  name: string;
  isChannel: boolean;
  isGroup: boolean;
  isIm: boolean;
  isPrivate: boolean;
  isArchived: boolean;
  members: string[];
  topic?: string;
  purpose?: string;
}

export interface SlackSearchOptions {
  query: string;
  limit?: number;
  sort?: 'score' | 'timestamp';
  sortDir?: 'asc' | 'desc';
}

export interface SlackSearchResult {
  messages: SlackMessage[];
  totalCount: number;
  hasMore: boolean;
}

// Base search result interface
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  integrationType?: IntegrationType;
  metadata?: Record<string, unknown>;
  url?: string;
  createdAt: string;
  updatedAt?: string;
  author?: string;
  tags?: string[];
  size?: number;
  contentType?: string;
  visibility?: 'public' | 'private' | 'shared' | 'restricted';
}

// Microsoft 365 types
export interface OutlookMessage {
  id: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  receivedDateTime: string;
  bodyPreview: string;
  body: string;
  hasAttachments: boolean;
  attachments?: OutlookAttachment[];
  importance: 'low' | 'normal' | 'high';
  isRead: boolean;
  isDraft: boolean;
  conversationId?: string;
  internetMessageId?: string;
}

export interface OutlookSearchOptions {
  query: string;
  limit?: number;
  skip?: number;
  folderId?: string;
}

export interface OutlookSearchResult {
  messages: OutlookMessage[];
  totalCount: number;
  hasMore: boolean;
}

export interface OutlookAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline: boolean;
  contentId?: string;
}

export interface OneDriveFile {
  id: string;
  name: string;
  size: number;
  createdDateTime: string;
  lastModifiedDateTime: string;
  webUrl: string;
  downloadUrl?: string;
  fileType: string;
  mimeType: string;
  isFolder: boolean;
  parentFolderId?: string;
  createdBy: {
    user: {
      displayName: string;
      email: string;
    };
  };
  lastModifiedBy: {
    user: {
      displayName: string;
      email: string;
    };
  };
  shared?: {
    scope: 'anonymous' | 'organization' | 'users';
    sharedBy: {
      user: {
        displayName: string;
        email: string;
      };
    };
    sharedDateTime: string;
  };
}

export interface OneDriveSearchOptions {
  query: string;
  limit?: number;
  skip?: number;
  folderId?: string;
  includeSubfolders?: boolean;
}

export interface OneDriveSearchResult {
  files: OneDriveFile[];
  totalCount: number;
  hasMore: boolean;
}

export interface OutlookCalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      countryOrRegion?: string;
      postalCode?: string;
    };
  };
  attendees: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
    type: 'required' | 'optional' | 'resource';
    status: {
      response: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded';
      time: string;
    };
  }>;
  organizer: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  bodyPreview: string;
  body: string;
  isAllDay: boolean;
  isCancelled: boolean;
  isOnlineMeeting: boolean;
  onlineMeetingProvider?: 'teamsForBusiness' | 'skypeForBusiness' | 'skypeForConsumer' | 'unknown';
  onlineMeetingUrl?: string;
  seriesMasterId?: string;
  recurrence?: {
    pattern: {
      type: 'daily' | 'weekly' | 'absoluteMonthly' | 'relativeMonthly' | 'absoluteYearly' | 'relativeYearly';
      interval: number;
      daysOfWeek?: string[];
      dayOfMonth?: number;
      month?: number;
    };
    range: {
      type: 'endDate' | 'noEnd' | 'numbered';
      startDate: string;
      endDate?: string;
      numberOfOccurrences?: number;
    };
  };
}

export interface OutlookCalendarSearchOptions {
  query: string;
  limit?: number;
  skip?: number;
  startDate?: string;
  endDate?: string;
  calendarId?: string;
}

export interface OutlookCalendarSearchResult {
  events: OutlookCalendarEvent[];
  totalCount: number;
  hasMore: boolean;
}

export interface WordDocument {
  id: string;
  name: string;
  size: number;
  createdDateTime: string;
  lastModifiedDateTime: string;
  webUrl: string;
  downloadUrl?: string;
  createdBy: {
    user: {
      displayName: string;
      email: string;
    };
  };
  lastModifiedBy: {
    user: {
      displayName: string;
      email: string;
    };
  };
  shared?: {
    scope: 'anonymous' | 'organization' | 'users';
    sharedBy: {
      user: {
        displayName: string;
        email: string;
      };
    };
    sharedDateTime: string;
  };
  content?: string;
  wordCount?: number;
  pageCount?: number;
}

export interface WordSearchOptions {
  query: string;
  limit?: number;
  skip?: number;
  folderId?: string;
}

export interface WordSearchResult {
  documents: WordDocument[];
  totalCount: number;
  hasMore: boolean;
}

export interface ExcelWorkbook {
  id: string;
  name: string;
  size: number;
  createdDateTime: string;
  lastModifiedDateTime: string;
  webUrl: string;
  downloadUrl?: string;
  createdBy: {
    user: {
      displayName: string;
      email: string;
    };
  };
  lastModifiedBy: {
    user: {
      displayName: string;
      email: string;
    };
  };
  shared?: {
    scope: 'anonymous' | 'organization' | 'users';
    sharedBy: {
      user: {
        displayName: string;
        email: string;
      };
    };
    sharedDateTime: string;
  };
  worksheets?: Array<{
    id: string;
    name: string;
    position: number;
    visibility: 'visible' | 'hidden' | 'veryHidden';
  }>;
}

export interface ExcelSearchOptions {
  query: string;
  limit?: number;
  skip?: number;
  folderId?: string;
}

export interface ExcelSearchResult {
  workbooks: ExcelWorkbook[];
  totalCount: number;
  hasMore: boolean;
}

// Procore Construction types
export interface ProcoreDocument {
  id: number;
  title: string;
  description?: string;
  file_name: string;
  file_size: number;
  content_type: string;
  created_at: string;
  updated_at: string;
  uploaded_by: {
    id: number;
    login: string;
    first_name: string;
    last_name: string;
    email_address: string;
  };
  project: {
    id: number;
    name: string;
    project_number: string;
  };
  folder: {
    id: number;
    name: string;
    full_path: string;
  };
  url: string;
  download_url?: string;
  is_private: boolean;
  tags: string[];
}

export interface ProcoreRfi {
  id: number;
  number: string;
  subject: string;
  question: string;
  answer?: string;
  status: 'open' | 'answered' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  due_date?: string;
  answered_at?: string;
  created_by: {
    id: number;
    login: string;
    first_name: string;
    last_name: string;
    email_address: string;
  };
  assigned_to?: {
    id: number;
    login: string;
    first_name: string;
    last_name: string;
    email_address: string;
  };
  project: {
    id: number;
    name: string;
    project_number: string;
  };
  trade: {
    id: number;
    name: string;
  };
  location?: {
    id: number;
    name: string;
    full_path: string;
  };
  attachments: Array<{
    id: number;
    file_name: string;
    file_size: number;
    content_type: string;
    url: string;
  }>;
}

export interface ProcoreSearchOptions {
  query: string;
  limit?: number;
  skip?: number;
  projectId?: number;
  folderId?: number;
}

export interface ProcoreDocumentSearchResult {
  documents: ProcoreDocument[];
  totalCount: number;
  hasMore: boolean;
}

export interface ProcoreRfiSearchResult {
  rfis: ProcoreRfi[];
  totalCount: number;
  hasMore: boolean;
}

// Procore API Response Types
export interface ProcoreApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
  };
}

export interface ProcoreApiDocument {
  id: number;
  title: string;
  description?: string;
  file_name: string;
  file_size: number;
  content_type: string;
  created_at: string;
  updated_at: string;
  uploaded_by: {
    id: number;
    login: string;
    first_name: string;
    last_name: string;
    email_address: string;
  };
  project: {
    id: number;
    name: string;
    project_number: string;
  };
  folder: {
    id: number;
    name: string;
    full_path: string;
  };
  url: string;
  download_url?: string;
  is_private: boolean;
  tags: string[];
}

export interface ProcoreApiRfi {
  id: number;
  number: string;
  subject: string;
  question: string;
  answer?: string;
  status: 'open' | 'answered' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  due_date?: string;
  answered_at?: string;
  created_by: {
    id: number;
    login: string;
    first_name: string;
    last_name: string;
    email_address: string;
  };
  assigned_to?: {
    id: number;
    login: string;
    first_name: string;
    last_name: string;
    email_address: string;
  };
  project: {
    id: number;
    name: string;
    project_number: string;
  };
  trade: {
    id: number;
    name: string;
  };
  location?: {
    id: number;
    name: string;
    full_path: string;
  };
  attachments: Array<{
    id: number;
    file_name: string;
    file_size: number;
    content_type: string;
    url: string;
  }>;
}

export interface ProcoreApiProject {
  id: number;
  name: string;
  project_number: string;
  status: string;
}

export interface ProcoreApiFolder {
  id: number;
  name: string;
  full_path: string;
}

export interface ProcoreApiUser {
  id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  company: {
    id: number;
    name: string;
  };
}

// Microsoft Graph API Response Types
export interface MicrosoftGraphResponse<T> {
  value: T[];
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
}

export interface MicrosoftGraphFile {
  id: string;
  name: string;
  size: number;
  createdDateTime: string;
  lastModifiedDateTime: string;
  webUrl: string;
  '@microsoft.graph.downloadUrl'?: string;
  createdBy: {
    user: {
      displayName: string;
      email: string;
    };
  };
  lastModifiedBy: {
    user: {
      displayName: string;
      email: string;
    };
  };
  shared?: {
    scope: 'anonymous' | 'organization' | 'users';
    sharedBy: {
      user: {
        displayName: string;
        email: string;
      };
    };
    sharedDateTime: string;
  };
  file?: {
    mimeType: string;
  };
  folder?: {
    childCount: number;
  };
  parentReference?: {
    id: string;
    name: string;
    path: string;
  };
}

export interface MicrosoftGraphMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  body: {
    content: string;
    contentType: 'text' | 'html';
  };
  receivedDateTime: string;
  sentDateTime: string;
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  ccRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  bccRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    contentType: string;
    size: number;
    isInline: boolean;
    contentId?: string;
    contentLocation?: string;
  }>;
  hasAttachments: boolean;
  importance: 'low' | 'normal' | 'high';
  isRead: boolean;
  isDraft: boolean;
  webLink: string;
}

export interface MicrosoftGraphCalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      countryOrRegion?: string;
      postalCode?: string;
    };
  };
  attendees: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
    type: 'required' | 'optional' | 'resource';
    status: {
      response: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded';
      time: string;
    };
  }>;
  organizer: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  bodyPreview: string;
  body: {
    content: string;
    contentType: 'text' | 'html';
  };
  isAllDay: boolean;
  isCancelled: boolean;
  isOnlineMeeting: boolean;
  onlineMeetingProvider?: 'teamsForBusiness' | 'skypeForBusiness' | 'skypeForConsumer' | 'unknown';
  onlineMeetingUrl?: string;
  seriesMasterId?: string;
  recurrence?: {
    pattern: {
      type: 'daily' | 'weekly' | 'absoluteMonthly' | 'relativeMonthly' | 'absoluteYearly' | 'relativeYearly';
      interval: number;
      daysOfWeek?: string[];
      dayOfMonth?: number;
      month?: number;
    };
    range: {
      type: 'endDate' | 'noEnd' | 'numbered';
      startDate: string;
      endDate?: string;
      numberOfOccurrences?: number;
    };
  };
}

export interface MicrosoftGraphCalendar {
  id: string;
  name: string;
  isDefaultCalendar: boolean;
  color: string;
}

export interface MicrosoftGraphMailFolder {
  id: string;
  displayName: string;
  parentFolderId?: string;
  childFolderCount: number;
  unreadItemCount: number;
  totalItemCount: number;
}

export interface MicrosoftGraphWorksheet {
  id: string;
  name: string;
  position: number;
  visibility: 'visible' | 'hidden' | 'veryHidden';
}

export interface MicrosoftGraphUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

export interface MicrosoftGraphAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline: boolean;
  contentId?: string;
  contentLocation?: string;
}

// Google APIs Response Types
export interface GoogleDriveApiFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
  owners?: Array<{
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
  }>;
  shared?: boolean;
  starred?: boolean;
  trashed?: boolean;
  version?: string;
  thumbnailLink?: string;
  iconLink?: string;
  hasThumbnail?: boolean;
  thumbnailVersion?: string;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
    rotation?: number;
  };
  videoMediaMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: string;
  };
}

export interface GoogleCalendarApiEvent {
  id: string;
  summary?: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    optional?: boolean;
    resource?: boolean;
  }>;
  organizer?: {
    email: string;
    displayName?: string;
  };
  creator?: {
    email: string;
    displayName?: string;
  };
  htmlLink?: string;
  iCalUID?: string;
  sequence?: number;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  transparency?: 'opaque' | 'transparent';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  recurringEventId?: string;
  originalStartTime?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  hangoutLink?: string;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
    conferenceSolution?: {
      key: {
        type: string;
      };
      name: string;
      iconUri: string;
    };
    conferenceId?: string;
    signature?: string;
  };
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: 'none' | 'freeBusyReader' | 'reader' | 'writer' | 'owner';
  defaultReminders?: Array<{
    method: string;
    minutes: number;
  }>;
  notificationSettings?: {
    notifications: Array<{
      type: string;
      method: string;
    }>;
  };
  primary?: boolean;
  deleted?: boolean;
  hidden?: boolean;
  selected?: boolean;
  summaryOverride?: string;
}

export interface GoogleSheet {
  properties: {
    sheetId: number;
    title: string;
    index: number;
    sheetType: 'GRID' | 'OBJECT';
    gridProperties?: {
      rowCount: number;
      columnCount: number;
      frozenRowCount?: number;
      frozenColumnCount?: number;
    };
    hidden?: boolean;
    tabColor?: {
      red: number;
      green: number;
      blue: number;
      alpha: number;
    };
    rightToLeft?: boolean;
  };
  data?: Array<{
    startRow?: number;
    startColumn?: number;
    rowData?: Array<{
      values?: Array<{
        userEnteredValue?: {
          stringValue?: string;
          numberValue?: number;
          boolValue?: boolean;
          formulaValue?: string;
        };
        effectiveValue?: {
          stringValue?: string;
          numberValue?: number;
          boolValue?: boolean;
          formulaValue?: string;
        };
        formattedValue?: string;
        userEnteredFormat?: {
          numberFormat?: {
            type: string;
            pattern?: string;
          };
          backgroundColor?: {
            red: number;
            green: number;
            blue: number;
            alpha: number;
          };
          textFormat?: {
            foregroundColor?: {
              red: number;
              green: number;
              blue: number;
              alpha: number;
            };
            fontFamily?: string;
            fontSize?: number;
            bold?: boolean;
            italic?: boolean;
            strikethrough?: boolean;
            underline?: boolean;
          };
        };
      }>;
    }>;
  }>;
}

export interface GooglePerson {
  resourceName: string;
  etag: string;
  names?: Array<{
    metadata: {
      primary?: boolean;
      source: {
        type: string;
        id: string;
      };
    };
    displayName?: string;
    familyName?: string;
    givenName?: string;
    middleName?: string;
    honorificPrefix?: string;
    honorificSuffix?: string;
    phoneticFamilyName?: string;
    phoneticGivenName?: string;
    phoneticMiddleName?: string;
    phoneticHonorificPrefix?: string;
    phoneticHonorificSuffix?: string;
  }>;
  emailAddresses?: Array<{
    metadata: {
      primary?: boolean;
      verified?: boolean;
      source: {
        type: string;
        id: string;
      };
    };
    value: string;
    displayName?: string;
    type?: string;
  }>;
  phoneNumbers?: Array<{
    metadata: {
      primary?: boolean;
      verified?: boolean;
      source: {
        type: string;
        id: string;
      };
    };
    value: string;
    canonicalForm?: string;
    type?: string;
    formattedType?: string;
  }>;
  organizations?: Array<{
    metadata: {
      primary?: boolean;
      source: {
        type: string;
        id: string;
      };
    };
    name?: string;
    title?: string;
    department?: string;
    type?: string;
    startDate?: {
      year?: number;
      month?: number;
      day?: number;
    };
    endDate?: {
      year?: number;
      month?: number;
      day?: number;
    };
    current?: boolean;
  }>;
  photos?: Array<{
    metadata: {
      primary?: boolean;
      source: {
        type: string;
        id: string;
      };
    };
    url: string;
    default?: boolean;
  }>;
  addresses?: Array<{
    metadata: {
      primary?: boolean;
      source: {
        type: string;
        id: string;
      };
    };
    formattedValue?: string;
    type?: string;
    poBox?: string;
    streetAddress?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    countryCode?: string;
  }>;
  birthdays?: Array<{
    metadata: {
      primary?: boolean;
      source: {
        type: string;
        id: string;
      };
    };
    date: {
      year?: number;
      month: number;
      day: number;
    };
  }>;
  events?: Array<{
    metadata: {
      primary?: boolean;
      source: {
        type: string;
        id: string;
      };
    };
    type?: string;
    date: {
      year?: number;
      month: number;
      day: number;
    };
  }>;
}

export interface GoogleDocsElement {
  textRun?: {
    content: string;
    textStyle?: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikethrough?: boolean;
      smallCaps?: boolean;
      backgroundColor?: {
        color: {
          rgbColor?: {
            red: number;
            green: number;
            blue: number;
            alpha: number;
          };
        };
      };
      foregroundColor?: {
        color: {
          rgbColor?: {
            red: number;
            green: number;
            blue: number;
            alpha: number;
          };
        };
      };
      fontSize?: {
        magnitude: number;
        unit: string;
      };
      weightedFontFamily?: {
        fontFamily: string;
        weight: number;
      };
    };
  };
  paragraph?: {
    elements: GoogleDocsElement[];
    paragraphStyle?: {
      namedStyleType?: string;
      alignment?: string;
      lineSpacing?: number;
      direction?: string;
      spacingMode?: string;
      spaceAbove?: {
        magnitude: number;
        unit: string;
      };
      spaceBelow?: {
        magnitude: number;
        unit: string;
      };
    };
  };
  table?: {
    tableRows: Array<{
      tableCells: Array<{
        content: GoogleDocsElement[];
      }>;
    }>;
  };
  tableOfContents?: {
    content: GoogleDocsElement[];
  };
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessagePayload {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailMessageHeader[];
  body?: {
    attachmentId?: string;
    size?: number;
    data?: string;
  };
  parts?: GmailMessagePayload[];
}

export interface GmailApiMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string;
  payload?: GmailMessagePayload;
  sizeEstimate?: number;
  raw?: string;
}

// Slack API Response Types
export interface SlackApiMessage {
  type: string;
  subtype?: string;
  text: string;
  user: string;
  ts: string;
  thread_ts?: string;
  reply_count?: number;
  reply_users_count?: number;
  latest_reply?: string;
  reply_users?: string[];
  is_locked?: boolean;
  subscribed?: boolean;
  last_read?: string;
  parent_user_id?: string;
  channel: string;
  event_ts?: string;
  channel_type?: string;
  hidden?: boolean;
  deleted_ts?: string;
  bot_id?: string;
  username?: string;
  icons?: {
    emoji?: string;
    image_64?: string;
  };
  attachments?: Array<{
    id: number;
    fallback?: string;
    color?: string;
    pretext?: string;
    author_name?: string;
    author_link?: string;
    author_icon?: string;
    title?: string;
    title_link?: string;
    text?: string;
    fields?: Array<{
      title: string;
      value: string;
      short?: boolean;
    }>;
    image_url?: string;
    thumb_url?: string;
    footer?: string;
    footer_icon?: string;
    ts?: number;
  }>;
  reactions?: Array<{
    name: string;
    count: number;
    users: string[];
  }>;
  permalink?: string;
}

export interface SlackApiChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  is_archived: boolean;
  is_general: boolean;
  unlinked: number;
  name_normalized: string;
  is_shared: boolean;
  is_org_shared: boolean;
  is_pending_ext_shared: boolean;
  pending_shared: string[];
  context_team_id?: string;
  updated: number;
  parent_conversation?: string;
  creator: string;
  is_ext_shared: boolean;
  is_global_shared: boolean;
  is_org_default: boolean;
  is_org_mandatory: boolean;
  is_moved: number;
  is_open: boolean;
  priority: number;
  user?: string;
  topic?: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose?: {
    value: string;
    creator: string;
    last_set: number;
  };
  num_members?: number;
}

// Asana API Response Types
export interface AsanaApiTask {
  gid: string;
  resource_type: string;
  name: string;
  resource_subtype?: string;
  approval_status?: string;
  assignee_status?: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: AsanaApiUser;
  created_at: string;
  due_at?: string;
  due_on?: string;
  external?: {
    gid: string;
    data: string;
  };
  followers: AsanaApiUser[];
  html_notes: string;
  hearted: boolean;
  hearts: AsanaApiUser[];
  is_rendered_as_separator: boolean;
  liked: boolean;
  likes: AsanaApiUser[];
  memberships: Array<{
    project: AsanaApiProject;
    section?: {
      gid: string;
      name: string;
    };
  }>;
  modified_at: string;
  notes: string;
  num_hearts: number;
  num_likes: number;
  num_subtasks: number;
  parent?: AsanaApiTask;
  permalink_url: string;
  projects: AsanaApiProject[];
  start_at?: string;
  start_on?: string;
  tags: AsanaApiTag[];
  workspace: {
    gid: string;
    name: string;
  };
}

export interface AsanaApiProject {
  gid: string;
  resource_type: string;
  name: string;
  archived: boolean;
  color?: string;
  created_at: string;
  current_status?: {
    gid: string;
    title: string;
    text: string;
    html_text: string;
    color: string;
    created_at: string;
    created_by: AsanaUser;
    modified_at: string;
  };
  current_status_update?: {
    gid: string;
    resource_type: string;
    title: string;
    text: string;
    html_text: string;
    status_type: string;
    created_at: string;
    created_by: AsanaUser;
    modified_at: string;
  };
  custom_field_settings?: Array<{
    gid: string;
    is_important: boolean;
    custom_field: {
      gid: string;
      name: string;
      type: string;
    };
  }>;
  default_view: string;
  due_date?: string;
  due_on?: string;
  html_notes: string;
  is_template: boolean;
  members: AsanaUser[];
  modified_at: string;
  notes: string;
  public: boolean;
  start_on?: string;
  workspace: {
    gid: string;
    name: string;
  };
  completed: boolean;
  completed_at?: string;
  completed_by?: AsanaUser;
  created_by?: AsanaUser;
  followers: AsanaUser[];
  icon?: string;
  owner?: AsanaUser;
  permalink_url: string;
  team?: {
    gid: string;
    name: string;
  };
}

export interface AsanaApiUser {
  gid: string;
  resource_type: string;
  name: string;
  email?: string;
  photo?: {
    image_21x21?: string;
    image_27x27?: string;
    image_36x36?: string;
    image_60x60?: string;
    image_128x128?: string;
  };
}

export interface AsanaApiTag {
  gid: string;
  resource_type: string;
  name: string;
  color?: string;
  created_at: string;
  followers: AsanaApiUser[];
  notes: string;
  permalink_url: string;
  workspace: {
    gid: string;
    name: string;
  };
}

export interface AsanaWorkspace {
  gid: string;
  resource_type: string;
  name: string;
  email_domains: string[];
  is_organization: boolean;
}

// QuickBooks API Response Types
export interface QuickBooksApiCustomer {
  Id: string;
  SyncToken: string;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
  Title?: string;
  GivenName?: string;
  MiddleName?: string;
  FamilyName?: string;
  Suffix?: string;
  FullyQualifiedName: string;
  CompanyName?: string;
  DisplayName: string;
  PrintOnCheckName?: string;
  Active: boolean;
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  PrimaryEmailAddr?: {
    Address: string;
  };
  DefaultTaxCodeRef?: {
    value: string;
  };
  Taxable?: boolean;
  BillAddr?: {
    Id: string;
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
  ShipAddr?: {
    Id: string;
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
  Job?: boolean;
  BillWithParent?: boolean;
  ParentRef?: {
    value: string;
  };
  Level?: number;
  SalesTermRef?: {
    value: string;
  };
  PaymentMethodRef?: {
    value: string;
  };
  CurrencyRef?: {
    value: string;
    name: string;
  };
  PreferredDeliveryMethod?: string;
  ResaleNum?: string;
  AcctNum?: string;
  Balance?: number;
  OpenBalanceDate?: string;
  BalanceWithJobs?: number;
  CreditLimit?: number;
  WebAddr?: {
    URI: string;
  };
  Notes?: string;
}

export interface QuickBooksApiInvoice {
  Id: string;
  SyncToken: string;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
  CustomField?: Array<{
    DefinitionId: string;
    Name: string;
    Type: string;
    StringValue?: string;
  }>;
  DocNumber?: string;
  TxnDate: string;
  DueDate?: string;
  SalesTermRef?: {
    value: string;
  };
  CustomerRef: {
    value: string;
    name: string;
  };
  CustomerMemo?: {
    value: string;
  };
  BillAddr?: {
    Id: string;
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
  ShipAddr?: {
    Id: string;
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
  FreeFormAddress?: boolean;
  ShipFromAddr?: {
    Id: string;
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
  PrintStatus?: string;
  EmailStatus?: string;
  BillEmail?: {
    Address: string;
  };
  RecurDataRef?: {
    value: string;
  };
  TotalAmt: number;
  HomeTotalAmt?: number;
  ApplyTaxAfterDiscount?: boolean;
  Balance: number;
  HomeBalance?: number;
  Deposit?: number;
  AllowIPNPayment?: boolean;
  AllowOnlinePayment?: boolean;
  AllowOnlineCreditCardPayment?: boolean;
  AllowOnlineACHPayment?: boolean;
  Domain?: string;
  sparse?: boolean;
  Line?: Array<{
    Id: string;
    LineNum?: number;
    Description?: string;
    Amount: number;
    DetailType: string;
    SalesItemLineDetail?: {
      ItemRef: {
        value: string;
        name: string;
      };
      UnitPrice?: number;
      Qty?: number;
      TaxCodeRef?: {
        value: string;
      };
    };
    SubTotalLineDetail?: {
      ItemRef: {
        value: string;
        name: string;
      };
    };
    DiscountLineDetail?: {
      PercentBased?: boolean;
      DiscountPercent?: number;
      DiscountAccountRef?: {
        value: string;
      };
      DiscountClassRef?: {
        value: string;
      };
    };
    TaxLineDetail?: {
      TaxRateRef: {
        value: string;
      };
      PercentBased?: boolean;
      TaxPercent?: number;
      NetAmountTaxable?: number;
      TaxInclusiveAmount?: number;
      OverrideDeltaAmount?: number;
      TaxCollectable?: number;
      Tax?: number;
    };
  }>;
  TxnTaxDetail?: {
    TotalTax?: number;
    TaxLine?: Array<{
      Amount: number;
      DetailType: string;
      TaxLineDetail?: {
        TaxRateRef: {
          value: string;
        };
        PercentBased?: boolean;
        TaxPercent?: number;
        NetAmountTaxable?: number;
        TaxInclusiveAmount?: number;
        OverrideDeltaAmount?: number;
        TaxCollectable?: number;
        Tax?: number;
      };
    }>;
  };
  LinkedTxn?: Array<{
    TxnId: string;
    TxnType: string;
  }>;
  PrivateNote?: string;
}

export interface QuickBooksApiItem {
  Id: string;
  SyncToken: string;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
  Name: string;
  Sku?: string;
  Description?: string;
  Active: boolean;
  SubItem?: boolean;
  ParentRef?: {
    value: string;
  };
  Level?: number;
  FullyQualifiedName: string;
  Taxable?: boolean;
  SalesTaxIncluded?: boolean;
  UnitPrice?: number;
  Type: string;
  IncomeAccountRef?: {
    value: string;
    name: string;
  };
  PurchaseDesc?: string;
  PurchaseCost?: number;
  ExpenseAccountRef?: {
    value: string;
    name: string;
  };
  AssetAccountRef?: {
    value: string;
    name: string;
  };
  TrackQtyOnHand?: boolean;
  QtyOnHand?: number;
  InvStartDate?: string;
  SalesTaxCodeRef?: {
    value: string;
  };
  PurchaseTaxCodeRef?: {
    value: string;
  };
}

export interface QuickBooksApiPayment {
  Id: string;
  SyncToken: string;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
  TxnDate: string;
  CurrencyRef?: {
    value: string;
    name: string;
  };
  PrivateNote?: string;
  Line?: Array<{
    Id: string;
    LineNum?: number;
    Description?: string;
    Amount: number;
    DetailType: string;
    LinkedTxn?: Array<{
      TxnId: string;
      TxnType: string;
    }>;
  }>;
  TotalAmt: number;
  HomeTotalAmt?: number;
  UnappliedAmt?: number;
  ProcessPayment?: boolean;
  PaymentRefNum?: string;
  PaymentMethodRef?: {
    value: string;
    name: string;
  };
  DepositToAccountRef?: {
    value: string;
    name: string;
  };
  CustomerRef?: {
    value: string;
    name: string;
  };
  ARAccountRef?: {
    value: string;
    name: string;
  };
  ExchangeRate?: number;
  DepartmentRef?: {
    value: string;
  };
  TxnSource?: string;
  GlobalTaxCalculation?: string;
  TransactionLocationType?: string;
}

export interface QuickBooksCompanyInfo {
  Id: string;
  SyncToken: string;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
  CompanyName: string;
  LegalName?: string;
  CompanyAddr?: {
    Id: string;
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
  CustomerCommunicationAddr?: {
    Id: string;
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
  LegalAddr?: {
    Id: string;
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  CompanyStartDate?: string;
  FiscalYearStartMonth?: string;
  Country?: string;
  SupportedLanguages?: string;
  NameValue?: Array<{
    Name: string;
    Value: string;
  }>;
  WebAddr?: {
    URI: string;
  };
  domain?: string;
  sparse?: boolean;
}
