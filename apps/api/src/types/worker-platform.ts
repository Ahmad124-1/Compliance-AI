export interface WorkerProfile {
  id: string;
  organizationId: string;
  userId: string;
  siteId: string | null;
  departmentId: string | null;
  teamId: string | null;
  employeeId: string | null;
  position: string | null;
  employmentType: string | null;
  joinDate: string | null;
  managerId: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  languages: string[];
  skills: string[];
  bio: string | null;
  profilePhotoUrl: string | null;
  attendanceSummary: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerDirectoryEntry {
  id: string;
  organizationId: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  siteName: string | null;
  departmentName: string | null;
  teamName: string | null;
  position: string | null;
  employeeId: string | null;
  managerName: string | null;
  languages: string[];
  skills: string[];
  status: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  organizationId: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  attachments: Record<string, unknown>[];
  readStatus: Record<string, unknown>;
  acknowledgementRequired: boolean;
  pinned: boolean;
  scheduledAt: string | null;
  locale: string;
  translations: Record<string, unknown>;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementRead {
  id: string;
  announcementId: string;
  userId: string;
  readAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}

export interface WorkerTask {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  description: string | null;
  taskType: 'task' | 'capa' | 'approval' | 'form' | 'event' | 'training';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  attachments: Record<string, unknown>[];
  metadata: Record<string, unknown>;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerDocument {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  category: 'policy' | 'employment' | 'safety' | 'handbook' | 'certificate' | 'payslip';
  fileUrl: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  downloadCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerForm {
  id: string;
  organizationId: string;
  userId: string;
  formType: 'leave' | 'document_request' | 'general' | 'improvement' | 'internal';
  title: string;
  data: Record<string, unknown>;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled';
  reviewedById: string | null;
  reviewedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerLearning {
  id: string;
  organizationId: string;
  userId: string;
  courseId: string | null;
  courseTitle: string;
  learningType: 'course' | 'video' | 'document' | 'quiz';
  status: 'not_started' | 'in_progress' | 'completed' | 'certified';
  progress: number;
  score: number | null;
  certificateUrl: string | null;
  dueDate: string | null;
  completedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
