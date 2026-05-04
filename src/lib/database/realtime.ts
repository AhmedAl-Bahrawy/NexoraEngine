/**
 * Realtime Subscriptions
 * Live data updates from Supabase realtime
 */

import { supabase } from './client'
import { REALTIME } from '../constants/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Types
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export interface RealtimeChange<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
}

export interface SubscriptionConfig {
  table: string
  event?: RealtimeEvent
  filter?: string
  schema?: string
}

export interface SubscriptionCallbacks<T> {
  onInsert?: (data: T) => void
  onUpdate?: (data: T) => void
  onDelete?: (data: T) => void
  onAll?: (change: RealtimeChange<T>) => void
  onError?: (error: Error) => void
}

// Subscribe to table changes
export function subscribeToTable<T extends Record<string, any>>(
  config: SubscriptionConfig,
  callbacks: SubscriptionCallbacks<T>
): RealtimeChannel {
  const { table, event = '*', filter, schema = 'public' } = config

  const channel = supabase
    .channel(`${table}_changes_${Date.now()}`)
    .on(
      'postgres_changes' as const,
      {
        event: event as any,
        schema,
        table,
        filter,
      },
      (payload: RealtimePostgresChangesPayload<T>) => {
        const change: RealtimeChange<T> = {
          eventType: payload.eventType as RealtimeChange<T>['eventType'],
          new: payload.new as T,
          old: payload.old as T,
        }

        try {
          switch (payload.eventType) {
            case REALTIME.EVENTS.INSERT:
              callbacks.onInsert?.(payload.new as T)
              break
            case REALTIME.EVENTS.UPDATE:
              callbacks.onUpdate?.(payload.new as T)
              break
            case REALTIME.EVENTS.DELETE:
              callbacks.onDelete?.(payload.old as T)
              break
          }

          callbacks.onAll?.(change)
        } catch (err) {
          callbacks.onError?.(err instanceof Error ? err : new Error(String(err)))
        }
      }
    )
    .subscribe((status) => {
      if (status === REALTIME.SUBSCRIBE_STATES.CHANNEL_ERROR && callbacks.onError) {
        callbacks.onError(new Error('Realtime subscription error'))
      }
    })

  return channel
}

// Subscribe with auto-cleanup
export function useSubscription<T extends Record<string, any>>(
  config: SubscriptionConfig,
  callbacks: SubscriptionCallbacks<T>,
  options?: { enabled?: boolean }
): () => void {
  if (options?.enabled === false) {
    return () => {}
  }

  const channel = subscribeToTable(config, callbacks)

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel)
  }
}

// Broadcast channel (for cross-tab communication)
export function createBroadcastChannel(channelName: string) {
  const channel = supabase.channel(channelName)

  return {
    subscribe: (callback: (payload: { event: string; payload: unknown }) => void) => {
      channel
        .on('broadcast', { event: '*' }, (payload) => {
          callback((payload as unknown) as { event: string; payload: unknown })
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    },

    send: async (event: string, payload: unknown) => {
      await channel.send({
        type: 'broadcast',
        event,
        payload,
      })
    },
  }
}

// Presence (for tracking online users)
export function createPresenceChannel(channelName: string) {
  const channel = supabase.channel(channelName)

  return {
    subscribe: (
      userId: string,
      userInfo: Record<string, unknown>,
      callbacks?: {
        onSync?: (users: unknown[]) => void
        onJoin?: (user: unknown) => void
        onLeave?: (user: unknown) => void
      }
    ) => {
      channel
        .on('presence', { event: 'sync' }, () => {
          const users = Object.values(channel.presenceState())
          callbacks?.onSync?.(users)
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          newPresences.forEach((presence) => {
            callbacks?.onJoin?.(presence)
          })
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          leftPresences.forEach((presence) => {
            callbacks?.onLeave?.(presence)
          })
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              userId,
              ...userInfo,
              online_at: new Date().toISOString(),
            })
          }
        })

      return () => {
        supabase.removeChannel(channel)
      }
    },

    untrack: async () => {
      await channel.untrack()
    },
  }
}

// Unsubscribe helper
export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel)
}

// Unsubscribe all channels
export async function unsubscribeAll(): Promise<void> {
  await supabase.removeAllChannels()
}
