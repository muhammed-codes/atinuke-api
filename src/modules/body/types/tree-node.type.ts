import { MaritalStatus, MarriageStatus, Sex } from '@prisma/client';

export interface SpouseNode {
  id: string;
  fullname: string;
  photo: string | null;
  sex: Sex;
  isAlive: boolean;
  maritalStatus: MaritalStatus;
}

export interface MarriageNode {
  status: MarriageStatus;
  marriageDate: string | null;
  endDate: string | null;
  spouse: SpouseNode;
  children: TreeNode[];
}

export interface TreeNode {
  id: string;
  fullname: string;
  photo: string | null;
  sex: Sex;
  isAlive: boolean;
  maritalStatus: MaritalStatus;
  marriages: MarriageNode[];
}

export interface TreeResponse {
  cached: boolean;
  tree: TreeNode;
}
