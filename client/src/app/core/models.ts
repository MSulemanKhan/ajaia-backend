export interface User {
  id: string;
  username: string;
  displayName: string;
}

export type AccessLevel = 'owner' | 'edit' | 'view';
export type Permission = 'edit' | 'view';

export interface DocumentSummary {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
  accessLevel: AccessLevel;
}

export interface ShareEntry extends User {
  permission: Permission;
}

export interface DocumentDetail extends DocumentSummary {
  contentHtml: string;
  shares?: ShareEntry[];
}

export interface DocumentListResponse {
  owned: DocumentSummary[];
  shared: DocumentSummary[];
}
