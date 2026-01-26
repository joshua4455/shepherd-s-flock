// Shared domain types for ChurchHub

export type ServiceGroup = "children" | "teens" | "youth" | "adults";

export type FollowUpStatus = "pending" | "contacted" | "discipled";

// Visitor-specific follow-up states used in the UI (includes conversion/member outcomes)
export type VisitorFollowUpStatus = "pending" | "contacted" | "converted" | "member";

export interface BaseEntity {
  id: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Member extends BaseEntity {
  fullName: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string; // ISO date string
  phoneNumber?: string;
  parentGuardian?: string; // for children/teens when applicable
  serviceCategory: ServiceGroup;
  careGroup?: string; // cell group / small group
  notes?: string;
}

export interface NewConvert extends BaseEntity {
  fullName: string;
  phoneNumber?: string;
  email?: string;
  serviceAttended: ServiceGroup;
  dateOfConversion: string; // ISO date string
  followUpStatus: FollowUpStatus;
  assignedLeader?: string;
  notes?: string;
}

export interface Visitor extends BaseEntity {
  fullName: string;
  phoneNumber?: string;
  email?: string;
  serviceAttended: ServiceGroup;
  firstVisitDate: string; // ISO date string
  howHeardAboutUs?: string;
  areasOfInterest?: string[];
  followUpStatus?: VisitorFollowUpStatus;
  notes?: string;
}

export interface DashboardStats {
  totalMembers: number;
  childrenCount: number;
  teensCount: number;
  youthCount: number;
  adultsCount: number;
  newVisitorsThisMonth: number;
  newConvertsThisMonth: number;
}
