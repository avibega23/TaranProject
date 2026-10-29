export type Role = "student" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  studentId: string;
  role: Role;
  accountStatus?: string;
  createdAt?: string;
};

export type ItemStatus = "pending" | "approved" | "rejected" | "resolved" | "archived";
export type ItemType = "lost" | "found";
export type ClaimStatus = "pending" | "approved" | "rejected" | "cancelled";

export type Item = {
  id: string;
  title: string;
  description: string;
  type: ItemType;
  category: string;
  location: string;
  eventDate: string;
  status: ItemStatus;
  imageUrl: string | null;
  contactPreference: "in_app" | "email";
  createdAt: string;
  updatedAt: string;
  reporterId?: string;
  identifyingDetails?: string;
  notes?: string;
};

export type Match = {
  item: Item;
  score: number;
  reasons: string[];
  sharedKeywords: string[];
  label: string;
};

export type Claim = {
  id: string;
  itemId: string;
  status: ClaimStatus;
  explanation: string;
  createdAt: string;
  updatedAt: string;
  reviewNote?: string;
  reviewedAt?: string | null;
  claimantId?: string;
  proofDescription?: string;
  itemTitle?: string;
};

export type Activity = {
  id: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type DashboardSummary = {
  lostReports: number;
  foundReports: number;
  activeClaims: number;
  pendingDecisions: number;
  resolvedReports: number;
  recentActivity: Activity[];
  recentItems: Item[];
};

export type AdminOverview = {
  pendingReports: number;
  approvedReports: number;
  rejectedReports: number;
  resolvedReports: number;
  pendingClaims: number;
  openLost: number;
  openFound: number;
  recentActivity: Activity[];
};

export type PublicStats = {
  lost: number;
  found: number;
  resolved: number;
};

export type FieldError = { path: string; message: string };
