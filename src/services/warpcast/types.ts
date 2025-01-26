import { NonNegative } from 'type-fest'

export interface Like {
  type: string
  hash: string
  reactor: User
  timestamp: number
  castHash: string
}

export interface Pfp {
  url: string
  verified: boolean
}

export interface Bio {
  text: string
  mentions: string[]
  channelMentions: string[]
}

export interface Location {
  placeId: string
  description: string
}

export interface Profile {
  bio: Bio
  location: Location
}

export interface ViewerContext {
  following: boolean
}

export interface User {
  fid: number
  username: string
  displayName: string
  pfp: Pfp
  profile: Profile
  followerCount: number
  followingCount: number
  activeOnFcNetwork: boolean
  viewerContext: ViewerContext
}

export interface OpenGraph {
  url: string
  sourceUrl: string
  title: string
  domain: string
  useLargeImage: boolean
  frame: {
    version: string
    frameUrl: string
    imageUrl: string
    postUrl: string
    buttons: {
      index: number
      title: string
      type: string
      target: string
    }[]
    imageAspectRatio: string
  }
}

export interface Url {
  type: string
  openGraph: OpenGraph
}

export interface Embeds {
  images: never[]
  urls: Url[]
  videos: never[]
  unknowns: never[]
  processedCastText: string
}

export interface Cast {
  hash: string
  threadHash: string
  author: User
  text: string
  timestamp: number
  mentions: never[]
  attachments: never
  embeds: Embeds
  replies: { count: number }
  reactions: { count: number }
  recasts: { count: number }
  watches: { count: number }
  tags: {
    type: string
    id: string
    name: string
    imageUrl: string
  }[]
  quoteCount: number
  combinedRecastCount: number
  viewerContext: {
    reacted: boolean
    recast: boolean
    bookmarked: boolean
  }
}

export interface Item {
  id: string
  timestamp: number
  cast: Cast
  otherParticipants: never[]
}

export interface Verification {
  fid: NonNegative<number>
  address: string
  timestamp: NonNegative<number>
  version: string
  protocol: string
}

export interface Collection {
  id: string
  name: string
  description?: string
  itemCount: number
  ownerCount: number
  farcasterOwnerCount: number
  imageUrl: string
  floorPrice?: string
  volumeTraded: string
  externalUrl?: string
  openSeaUrl: string
  twitterUsername?: string
  schemaName?: string
}

export interface Message {
  conversationId: string
  senderFid: number
  messageId: string
  serverTimestamp: number
  type: string
  message: string
  hasMention: boolean
  reactions: never[]
  isPinned: boolean
  isDeleted: boolean
}

export interface Conversation {
  conversationId: string
  name: string
  photoUrl: string
  adminFids: number[]
  removedFids: number[]
  participants: User[]
  lastReadTime: number
  selfLastReadTime: number
  lastMessage: Message
  pinnedMessages: never[]
  hasPinnedMessages: boolean
  isGroup: boolean
  isCollectionTokenGated: boolean
  unreadCount: number
  muted: boolean
  hasMention: boolean
  groupPreferences: {
    membersCanInvite: boolean
  }
  viewerContext: ViewerContext
}

export interface StarterPack {
  id: string
  creator: User
  name: string
  description: string
  openGraphImageUrl: string
  itemCount: number
  items: User[]
  labels: string[]
}
