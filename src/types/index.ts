export type ServiceGroup = 'children' | 'teens' | 'youth' | 'adults';

export type FollowUpStatus = 'pending' | 'contacted' | 'discipled';

export type VisitorFollowUpStatus = 'pending' | 'contacted' | 'converted' | 'member';

export interface Member {
  id: string;
  fullName: string;
  gender: 'male' | 'female';
  dateOfBirth?: string;
  phoneNumber?: string;
  parentGuardian?: string;
  serviceCategory: ServiceGroup;
  careGroup?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewConvert {
  id: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  serviceAttended: ServiceGroup;
  dateOfConversion: string;
  followUpStatus: FollowUpStatus;
  assignedLeader?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Visitor {
  id: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  serviceAttended: ServiceGroup;
  firstVisitDate: string;
  howHeardAboutUs?: string;
  areasOfInterest?: string[];
  followUpStatus: VisitorFollowUpStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
