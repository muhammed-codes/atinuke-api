import { Chronicle, ChronicleCategory, ChronicleStatus, ChronicleAttributionType, ChronicleMedia, ChronicleTaggedBody, ChronicleComment, Body } from '@prisma/client';

export type ChronicleSummary = {
  id: string;
  title: string;
  excerpt: string;
  category: ChronicleCategory;
  status: ChronicleStatus;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  attributedToType: ChronicleAttributionType;
  attributedToLabel: string | null;
  attributedToBodyId: string | null;
  attributedToBody: { id: string; fullname: string } | null;
  author: { displayName: string; profilePhoto: string | null } | null;
  media: { type: string; url: string }[];
  likes: { count: number; userHasLiked: boolean };
  _count: { comments: number };
};

export type ChronicleResponse = Chronicle & {
  media: ChronicleMedia[];
  taggedBodies: (ChronicleTaggedBody & { body: Body & { photos: any[] } })[];
  attributedToBody: (Body & { photos: any[] }) | null;
  comments: (ChronicleComment & {
    author: {
      displayName: string;
      profilePhoto: string | null;
    } | null;
  })[];
  likes: {
    count: number;
    userHasLiked: boolean;
  };
  pendingEdit?: Chronicle | null;
};
