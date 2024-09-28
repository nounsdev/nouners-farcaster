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

interface Result {
  casts: Cast[]
  next?: {
    cursor: string
  }
}

export const fetchFarcasterFeed = async (env: Env): Promise<Result> => {
  const { NEYNAR_API_KEY: apiKey, NEYNAR_API_URL: apiUrl } = env

  const url = `${apiUrl}/v2/farcaster/feed/channels?channel_ids=nouns&with_recasts=true&with_replies=false&limit=100&should_moderate=false`
  const headers = {
    accept: 'application/json',
    api_key: apiKey,
  }

  let casts: Cast[] = []
  let cursor: string | undefined

  try {
    for (let i = 0; i < 10; i++) {
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

      if (data.next?.cursor) {
        cursor = data.next.cursor
      } else {
        break // Stop if there is no next cursor
      }

      if (casts.length >= 1000) {
        casts = casts.slice(0, 1000) // Ensure no more than 1000 casts are returned
        break
      }
    }

    return { casts }
  } catch {
    throw new Error(
      'An unknown error occurred while fetching the Farcaster feed',
    )
  }
}
