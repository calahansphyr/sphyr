/**
 * Type definitions for construction industry integrations
 */

export interface ConstructionProject {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  budget?: number;
  location?: string;
  client?: string;
  contractor?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export interface ConstructionDocument {
  id: string;
  projectId: string;
  name: string;
  type: DocumentType;
  category: string;
  version: string;
  status: DocumentStatus;
  fileUrl?: string;
  fileSize?: number;
  uploadedBy: string;
  uploadedAt: string;
  metadata: Record<string, unknown>;
}

export type DocumentType = 
  | 'drawing'
  | 'specification'
  | 'contract'
  | 'permit'
  | 'photo'
  | 'report'
  | 'other';

export type DocumentStatus = 
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'superseded';

export interface RFI {
  id: string;
  projectId: string;
  number: string;
  subject: string;
  question: string;
  answer?: string;
  status: RFIStatus;
  submittedBy: string;
  submittedAt: string;
  dueDate?: string;
  answeredBy?: string;
  answeredAt?: string;
}

export type RFIStatus = 
  | 'open'
  | 'answered'
  | 'closed'
  | 'overdue';

export interface Submittal {
  id: string;
  projectId: string;
  number: string;
  name: string;
  description: string;
  status: SubmittalStatus;
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  dueDate?: string;
}

export type SubmittalStatus = 
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'revise_and_resubmit';

export interface DailyLog {
  id: string;
  projectId: string;
  date: string;
  weather?: string;
  workPerformed: string;
  workersOnSite: number;
  equipmentUsed: string[];
  issues?: string;
  photos?: string[];
  createdBy: string;
  createdAt: string;
}

export interface ChangeOrder {
  id: string;
  projectId: string;
  number: string;
  description: string;
  amount: number;
  status: ChangeOrderStatus;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  reason?: string;
}

export type ChangeOrderStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled';

// Procore-specific types
export interface ProcoreProject extends ConstructionProject {
  procoreId: string;
  companyId: string;
  projectNumber?: string;
  address?: ProcoreAddress;
  projectType?: string;
  projectPhase?: string;
}

export interface ProcoreAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Buildertrend-specific types
export interface BuildertrendProject extends ConstructionProject {
  buildertrendId: string;
  clientId: string;
  projectType?: string;
  squareFootage?: number;
  lotSize?: number;
  bedrooms?: number;
  bathrooms?: number;
}

export interface BuildertrendClient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: ProcoreAddress;
  createdAt: string;
}
