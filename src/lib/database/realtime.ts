import { getClient } from '../core/client'
import { REALTIME } from '../constants/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

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

export interface SubscriptionHandle {
  channel: RealtimeChannel
  unsubscribe: () => Promise<void>
}

const activeChannels = new Map<string, RealtimeChannel>()

export function subscribeToTable<T extends Record<string, unknown>>(
  config: SubscriptionConfig,
  callbacks: SubscriptionCallbacks<T>
): SubscriptionHandle {
  const { table, event = '*', filter, schema = 'public' } = config
  const supabase = getClient()

  const channelKey = `${schema}.${table}:${event}:${filter ?? ''}`

  if (activeChannels.has(channelKey)) {
    const existing = activeChannels.get(channelKey)!
    return {
      channel: existing,
      unsubscribe: async () => {
        await supabase.removeChannel(existing)
        activeChannels.delete(channelKey)
      },
    }
  }

  const channel = (supabase as any)
    .channel(`${table}_changes_${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event,
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
    .subscribe((status: string) => {
      if (status === REALTIME.SUBSCRIBE_STATES.CHANNEL_ERROR && callbacks.onError) {
        callbacks.onError(new Error('Realtime subscription error'))
      }
    })

  activeChannels.set(channelKey, channel)

  return {
    channel,
    unsubscribe: async () => {
      await supabase.removeChannel(channel)
      activeChannels.delete(channelKey)
    },
  }
}

export function subscribeToTables<T extends Record<string, unknown>>(
  configs: Array<{ config: SubscriptionConfig; callbacks: SubscriptionCallbacks<T> }>
): Array<SubscriptionHandle> {
  return configs.map(({ config, callbacks }) => subscribeToTable<T>(config, callbacks))
}

export function getActiveSubscriptions(): string[] {
  return Array.from(activeChannels.keys())
}

export function createBroadcastChannel(channelName: string) {
  const supabase = getClient()
  const channel = supabase.channel(channelName)

  return {
    subscribe: (callback: (payload: { event: string; payload: unknown }) => void) => {
      channel
        .on('broadcast', { event: '*' }, (payload) => {
          callback(payload as unknown as { event: string; payload: unknown })
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

    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}

export function createPresenceChannel(channelName: string) {
  const supabase = getClient()
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

    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}

export async function unsubscribe(handle: SubscriptionHandle | RealtimeChannel): Promise<void> {
  const supabase = getClient()
  if ('unsubscribe' in handle) {
    await handle.unsubscribe()
  } else {
    await supabase.removeChannel(handle)
  }
}

export async function unsubscribeAll(): Promise<void> {
  const supabase = getClient()
  const handles = Array.from(activeChannels.values())
  for (const channel of handles) {
    await supabase.removeChannel(channel)
  }
  activeChannels.clear()
  await supabase.removeAllChannels()
}
