import { IntRange } from 'type-fest'

interface User {
  object: string
  fid: number
  custody_address: string
  username: string
  display_name: string
  pfp_url: string
  profile: {
    bio: {
      text: string
    }
  }
  follower_count: number
  following_count: number
  verifications: string[]
  verified_addresses: {
    eth_addresses: string[]
    sol_addresses: string[]
  }
  active_status: string
  power_badge: boolean
}

interface Reaction {
  reaction_type: string
  reaction_timestamp: string
  object: string
  user: User
}

interface Cast {
  object: string
  hash: string
  thread_hash: string
  parent_hash: string | null
  parent_url: string
  root_parent_url: string
  parent_author: {
    fid: number | null
  }
  author: User
  text: string
  timestamp: string
  embeds: string[]
  reactions: {
    likes_count: number
    recasts_count: number
    likes: unknown[]
    recasts: unknown[]
  }
  replies: {
    count: number
  }
  channel: {
    object: string
    id: string
    name: string
    image_url: string
  }
  mentioned_profiles: User[]
}

interface FeedResponse {
  casts: Cast[]
  next?: {
    cursor: string
  }
}

interface ErrorResponse {
  code: string
  message: string
  property: string
}

interface FeedResult {
  casts: Cast[]
  cursor?: string | null
}

interface ReactionResult {
  reactions: Reaction[]
  cursor?: string | null
}

interface ReactionResponse {
  reactions: Reaction[]
  cursor?: string | null
}

export const fetchFarcasterFeed = async (
  env: Env,
  cursor?: string,
): Promise<FeedResult> => {
  const { NEYNAR_API_KEY: apiKey, NEYNAR_API_URL: apiUrl } = env

  const url = `${apiUrl}/v2/farcaster/feed/channels?channel_ids=nouns&with_recasts=true&with_replies=false&limit=100&should_moderate=false`
  const headers = {
    accept: 'application/json',
    api_key: apiKey,
  }

  let casts: Cast[] = []

  try {
    // We loop 10 times since each request returns 100 casts
    const response = await fetch(cursor ? `${url}&cursor=${cursor}` : url, {
      headers,
    })

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json()
      console.error(errorData.message)
      return { casts }
    }

    const data: FeedResponse = await response.json()
    casts = [...casts, ...data.casts]

    return { casts, cursor }
  } catch {
    throw new Error(
      'An unknown error occurred while fetching the Farcaster feed',
    )
  }
}

// New method to fetch likes for a specific cast
export const fetchFarcasterCastReactions = async (
  env: Env,
  castHash: string,
  types = 'likes',
  limit: IntRange<1, 101> = 100,
): Promise<ReactionResult> => {
  const { NEYNAR_API_KEY: apiKey, NEYNAR_API_URL: apiUrl } = env

  const url = `${apiUrl}/v2/farcaster/reactions/cast?hash=${castHash}&types=${types}&limit=${limit.toString()}`
  const headers = {
    accept: 'application/json',
    api_key: apiKey,
  }

  let reactions: Reaction[] = []
  let cursor: string | null = null

  try {
    do {
      const response = await fetch(cursor ? `${url}&cursor=${cursor}` : url, {
        headers,
      })

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json()
        console.error(errorData.message)
        return { reactions: [] }
      }

      const data: ReactionResponse = await response.json()
      reactions = [...reactions, ...data.reactions]

      cursor = data.cursor ?? null
    } while (cursor)

    return { reactions, cursor }
  } catch (error) {
    console.error('Error fetching cast reactions:', error)
    throw new Error('An unknown error occurred while fetching cast reactions')
  }
}
