export type ServiceType = 'lash_ext' | 'lash_lift' | 'brow' | 'waxing';

export interface ClientInfo {
  fullName: string;
  phone: string;
  email: string;
  dob: string;
}

export interface ParentInfo {
  fullName: string;
  relationship: string;
  phone: string;
  email: string;
}

export interface SubmissionData {
  services: ServiceType[];
  clientInfo: ClientInfo;
  isMinor: boolean;
  parentInfo?: ParentInfo;
  medicalInfo: Record<string, any>;
  acknowledgments: Record<string, boolean>;
  consents: {
    photoConsent: boolean;
  };
  signatures: {
    client: string;
    parent?: string;
  };
  createdAt: any;
}
