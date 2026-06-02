import { createBrowserClient } from '@supabase/ssr'

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Return cached client if already created
  if (clientInstance) {
    return clientInstance
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('[v0] Supabase env vars not available', {
      hasUrl: !!url,
      hasKey: !!key,
      url: url ? url.substring(0, 20) + '...' : 'undefined',
    })
    throw new Error(
      'Supabase configuration incomplete. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
  }

  try {
    console.log('[v0] Creating Supabase client with URL:', url.substring(0, 50) + '...')
    clientInstance = createBrowserClient(url, key)
    console.log('[v0] Supabase client created successfully')
    return clientInstance
  } catch (error) {
    console.error('[v0] Failed to create Supabase client', error)
    throw error
  }
}
