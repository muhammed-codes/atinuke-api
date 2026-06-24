import { Chronicle, ChronicleCategory, ChronicleStatus, ChronicleAttributionType, ChronicleMedia, ChronicleTaggedBody, ChronicleComment, Body } from '@prisma/client';

export type ChronicleSummary = {
  id: string;
  title: string;
  excerpt: string;
  category: ChronicleCategory;
  status: ChronicleStatus;
  isPinned: boolean;
  createdAt: Date;
  likeCount: number;
  commentCount: number;
  authorDisplayInfo: {
    name: string;
    photoUrl: string | null;
  };
  coverMedia: ChronicleMedia | null;
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
