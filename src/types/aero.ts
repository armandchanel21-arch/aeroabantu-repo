export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  isEmergency: boolean;
  isVerified: boolean;
  lastKnownLocation?: {
    lat: number;
    lng: number;
    timestamp: number;
  };
}

export enum AppMode {
  MAP = 'MAP',
  CONTACTS = 'CONTACTS',
  AI_SETTINGS = 'AI_SETTINGS',
  AUTH = 'AUTH',
  PROFILE = 'PROFILE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface LiveSharingState {
  isActive: boolean;
  sharedWithIds: string[];
  expiresAt: number | null; // null means 'Until I stop'
}

export interface AIMessage {
  id: string;
  text: string;
  timestamp: number;
}
