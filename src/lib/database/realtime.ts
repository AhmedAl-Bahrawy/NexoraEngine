import type { SupabaseClient, RealtimeChannel, RealtimePostgresChangesPayload, RealtimePresenceState } from '@supabase/supabase-js'
import { getClient } from '../core/client'
import { REALTIME } from '../constants/supabase'
import { NexoraError } from '../errors/nexora-error'

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'
export type RealtimeChannelState = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED' | 'CONNECTING'
export type RealtimeConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export interface RealtimeChange<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
  schema: string
  table: string
  commitTimestamp: string
}

export interface ChannelInfo {
  key: string
  channel: RealtimeChannel
  type: 'postgres_changes' | 'broadcast' | 'presence'
  state: RealtimeChannelState
  subscribedAt: number | null
}

export interface SubscriptionConfig {
  table: string
  event?: RealtimeEvent
  filter?: string
  schema?: string
  channelName?: string
  timeout?: number
}

export interface SubscriptionCallbacks<T = Record<string, unknown>> {
  onInsert?: (data: T) => void
  onUpdate?: (data: T) => void
  onDelete?: (data: T) => void
  onAll?: (change: RealtimeChange<T>) => void
  onError?: (error: Error) => void
  onSubscribed?: (channelInfo: ChannelInfo) => void
  onTimedOut?: () => void
  onClosed?: () => void
}

export interface SubscriptionHandle {
  channel: RealtimeChannel
  unsubscribe: () => Promise<void>
  isSubscribed: () => boolean
  getState: () => RealtimeChannelState
}

interface TrackedPresence {
  userId: string
  userInfo: Record<string, unknown>
}

const activeChannels = new Map<string, ChannelInfo>()
let connectionState: RealtimeConnectionState = 'disconnected'
const connectionListeners = new Set<(state: RealtimeConnectionState) => void>()

function buildChannelKey(config: SubscriptionConfig): string {
  const schema = config.schema ?? 'public'
  const event = config.event ?? '*'
  const filter = config.filter ?? ''
  return `db:${schema}.${config.table}:${event}:${filter}`
}

function handleChannelState(
  status: string,
  channelInfo: ChannelInfo,
  callbacks?: SubscriptionCallbacks
): void {
  channelInfo.state = status as RealtimeChannelState

  switch (status) {
    case REALTIME.SUBSCRIBE_STATES.SUBSCRIBED:
      channelInfo.subscribedAt = Date.now()
      updateConnectionState('connected')
      callbacks?.onSubscribed?.(channelInfo)
      break
    case REALTIME.SUBSCRIBE_STATES.CHANNEL_ERROR:
      updateConnectionState('disconnected')
      callbacks?.onError?.(new NexoraError(
        'Realtime subscription error',
        'realtime_channel_error',
        { statusCode: 500 }
      ))
      break
    case REALTIME.SUBSCRIBE_STATES.TIMED_OUT:
      callbacks?.onTimedOut?.()
      break
    case REALTIME.SUBSCRIBE_STATES.CLOSED:
      updateConnectionState('disconnected')
      callbacks?.onClosed?.()
      break
  }
}

function updateConnectionState(state: RealtimeConnectionState): void {
  if (connectionState === state) return
  connectionState = state
  for (const listener of connectionListeners) {
    try {
      listener(state)
    } catch {
      // Ignore listener errors
    }
  }
}

function getOrCreateChannel(
  supabase: SupabaseClient,
  config: SubscriptionConfig,
  channelInfo: ChannelInfo,
  callbacks?: SubscriptionCallbacks
): RealtimeChannel {
  const { table, event = '*', filter, schema = 'public' } = config
  const timeout = config.timeout ?? REALTIME.DEFAULT_TIMEOUT

  const channel = supabase.channel(config.channelName ?? `${table}_changes_${Date.now()}`, {
    config: {
      broadcast: { ack: false, self: false },
      presence: { key: '' },
    },
  })

  channel.on(
    'postgres_changes',
    { event, schema, table, filter },
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const change: RealtimeChange<Record<string, unknown>> = {
        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        new: payload.new ?? null,
        old: payload.old ?? null,
        schema: payload.schema,
        table: payload.table,
        commitTimestamp: payload.commit_timestamp ?? new Date().toISOString(),
      }

      try {
        switch (payload.eventType) {
          case REALTIME.EVENTS.INSERT:
            callbacks?.onInsert?.(payload.new as Record<string, unknown>)
            break
          case REALTIME.EVENTS.UPDATE:
            callbacks?.onUpdate?.(payload.new as Record<string, unknown>)
            break
          case REALTIME.EVENTS.DELETE:
            callbacks?.onDelete?.(payload.old as Record<string, unknown>)
            break
        }
        callbacks?.onAll?.(change)
      } catch (err) {
        callbacks?.onError?.(err instanceof Error ? err : new Error(String(err)))
      }
    }
  )

  return channel
}

export function subscribeToTable<T extends Record<string, unknown> = Record<string, unknown>>(
  config: SubscriptionConfig,
  callbacks?: SubscriptionCallbacks<T>
): SubscriptionHandle {
  const supabase = getClient()
  const channelKey = buildChannelKey(config)

  const channelInfo: ChannelInfo = {
    key: channelKey,
    channel: null as unknown as RealtimeChannel,
    type: 'postgres_changes',
    state: 'CONNECTING',
    subscribedAt: null,
  }

  if (activeChannels.has(channelKey)) {
    const existing = activeChannels.get(channelKey)!
    return {
      channel: existing.channel,
      unsubscribe: async () => {
        await existing.channel.unsubscribe()
        await supabase.removeChannel(existing.channel)
        activeChannels.delete(channelKey)
      },
      isSubscribed: () => existing.state === 'SUBSCRIBED',
      getState: () => existing.state,
    }
  }

  const { table, event = '*', filter, schema = 'public' } = config
  const timeout = config.timeout ?? REALTIME.DEFAULT_TIMEOUT

  const channel = supabase.channel(config.channelName ?? `${table}_changes_${Date.now()}`)

  channel.on(
    'postgres_changes',
    { event, schema, table, filter },
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const change: RealtimeChange<Record<string, unknown>> = {
        eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        new: payload.new ?? null,
        old: payload.old ?? null,
        schema: payload.schema,
        table: payload.table,
        commitTimestamp: payload.commit_timestamp ?? new Date().toISOString(),
      }

      try {
        switch (payload.eventType) {
          case REALTIME.EVENTS.INSERT:
            callbacks?.onInsert?.(payload.new as unknown as T)
            break
          case REALTIME.EVENTS.UPDATE:
            callbacks?.onUpdate?.(payload.new as unknown as T)
            break
          case REALTIME.EVENTS.DELETE:
            callbacks?.onDelete?.(payload.old as unknown as T)
            break
        }
        callbacks?.onAll?.(change as RealtimeChange<T>)
      } catch (err) {
        callbacks?.onError?.(err instanceof Error ? err : new Error(String(err)))
      }
    }
  )

  channel.subscribe((status: string) => {
    channelInfo.state = status as RealtimeChannelState
    handleChannelState(status, channelInfo, callbacks as SubscriptionCallbacks)
  }, timeout)

  channelInfo.channel = channel
  activeChannels.set(channelKey, channelInfo)

  return {
    channel,
    unsubscribe: async () => {
      try {
        await channel.unsubscribe()
      } finally {
        await supabase.removeChannel(channel)
        activeChannels.delete(channelKey)
      }
    },
    isSubscribed: () => channelInfo.state === 'SUBSCRIBED',
    getState: () => channelInfo.state,
  }
}

export interface TableSubscription<T extends Record<string, unknown>> {
  config: SubscriptionConfig
  callbacks: SubscriptionCallbacks<T>
}

export function subscribeToTables(
  subscriptions: Array<{
    config: SubscriptionConfig
    callbacks: SubscriptionCallbacks<Record<string, unknown>>
  }>
): Array<SubscriptionHandle> {
  return subscriptions.map(({ config, callbacks }) =>
    subscribeToTable(config, callbacks)
  )
}

export function subscribeToRow<T extends Record<string, unknown> = Record<string, unknown>>(
  table: string,
  rowId: string | number,
  callbacks?: SubscriptionCallbacks<T>,
  options?: { schema?: string; events?: RealtimeEvent[]; channelName?: string; timeout?: number }
): SubscriptionHandle {
  const events = options?.events ?? ['*']
  const eventsList = events.length > 1 ? '*' : events[0]

  return subscribeToTable<T>(
    {
      table,
      event: eventsList as RealtimeEvent,
      filter: `id=eq.${rowId}`,
      schema: options?.schema ?? 'public',
      channelName: options?.channelName ?? `${table}_row_${rowId}`,
      timeout: options?.timeout,
    },
    callbacks
  )
}

export function getChannels(): ChannelInfo[] {
  return Array.from(activeChannels.values())
}

export function getActiveSubscriptions(): string[] {
  return Array.from(activeChannels.keys())
}

export function getChannelInfo(key: string): ChannelInfo | undefined {
  return activeChannels.get(key)
}

export function isChannelActive(key: string): boolean {
  return activeChannels.has(key)
}

export function getChannelState(key: string): RealtimeChannelState | undefined {
  return activeChannels.get(key)?.state
}

export function getSubscribedChannels(): ChannelInfo[] {
  return Array.from(activeChannels.values()).filter(
    (info) => info.state === 'SUBSCRIBED'
  )
}

export function getConnectionState(): RealtimeConnectionState {
  return connectionState
}

export function onConnectionChange(callback: (state: RealtimeConnectionState) => void): () => void {
  connectionListeners.add(callback)
  callback(connectionState)
  return () => {
    connectionListeners.delete(callback)
  }
}

export interface BroadcastChannelHandle {
  on: (event: string, callback: (payload: unknown, event: string) => void) => BroadcastChannelHandle
  send: (event: string, payload: unknown, options?: { self?: boolean }) => Promise<void>
  subscribe: () => BroadcastChannelHandle
  unsubscribe: () => Promise<void>
  getState: () => RealtimeChannelState
  isSubscribed: () => boolean
}

export function createBroadcastChannel(channelName: string): BroadcastChannelHandle {
  const supabase = getClient()
  const channel = supabase.channel(channelName)
  let state: RealtimeChannelState = 'CONNECTING'
  const eventHandlers = new Map<string, Set<(payload: unknown, event: string) => void>>()

  return {
    on(event: string, callback: (payload: unknown, event: string) => void) {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, new Set())
      }
      eventHandlers.get(event)!.add(callback)
      return this
    },

    async send(event: string, payload: unknown, options?: { self?: boolean }) {
      await channel.send({
        type: 'broadcast',
        event,
        payload,
      })
    },

    subscribe() {
      for (const [event] of eventHandlers) {
        channel.on('broadcast', { event }, (msg) => {
          const handlers = eventHandlers.get(event)
          handlers?.forEach((handler) => {
            try {
              handler(msg.payload, msg.event)
            } catch {
              // Ignore handler errors
            }
          })
        })
      }

      if (eventHandlers.size === 0) {
        channel.on('broadcast', { event: '*' }, (msg) => {
          for (const handlers of eventHandlers.values()) {
            handlers.forEach((handler) => {
              try {
                handler(msg.payload, msg.event)
              } catch {
                // Ignore handler errors
              }
            })
          }
        })
      }

      channel.subscribe((status: string) => {
        state = status as RealtimeChannelState
        updateConnectionState(status === 'SUBSCRIBED' ? 'connected' : 'disconnected')
      })

      return this
    },

    async unsubscribe() {
      try {
        await channel.unsubscribe()
      } finally {
        await supabase.removeChannel(channel)
        eventHandlers.clear()
      }
    },

    getState() {
      return state
    },

    isSubscribed() {
      return state === 'SUBSCRIBED'
    },
  }
}

export interface PresenceChannelHandle {
  subscribe: (
    userId: string,
    userInfo: Record<string, unknown>,
    callbacks?: PresenceCallbacks
  ) => () => Promise<void>
  untrack: () => Promise<void>
  unsubscribe: () => Promise<void>
  getState: () => RealtimePresenceState
  getPresenceCount: () => number
  isTracking: () => boolean
}

export interface PresenceCallbacks {
  onSync?: (users: Record<string, unknown[]>) => void
  onJoin?: (presences: Record<string, unknown[]>) => void
  onLeave?: (presences: Record<string, unknown[]>) => void
  onSubscribed?: () => void
  onError?: (error: Error) => void
  onTimedOut?: () => void
  onClosed?: () => void
}

export function createPresenceChannel(channelName: string): PresenceChannelHandle {
  const supabase = getClient()
  const channel = supabase.channel(channelName, {
    config: {
      presence: { key: '' },
    },
  })
  let state: RealtimeChannelState = 'CONNECTING'
  let currentUserId: string | null = null
  let currentUserInfo: Record<string, unknown> | null = null
  let isTracked = false

  return {
    subscribe(
      userId: string,
      userInfo: Record<string, unknown>,
      callbacks?: PresenceCallbacks
    ): () => Promise<void> {
      currentUserId = userId
      currentUserInfo = userInfo

      channel.on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        callbacks?.onSync?.(presenceState as unknown as Record<string, unknown[]>)
      })

      channel.on('presence', { event: 'join' }, ({ newPresences }) => {
        callbacks?.onJoin?.(newPresences as unknown as Record<string, unknown[]>)
      })

      channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        callbacks?.onLeave?.(leftPresences as unknown as Record<string, unknown[]>)
      })

      channel.subscribe(async (status: string) => {
        state = status as RealtimeChannelState
        if (status === REALTIME.SUBSCRIBE_STATES.SUBSCRIBED) {
          await channel.track({
            userId,
            ...userInfo,
            online_at: new Date().toISOString(),
          })
          isTracked = true
          callbacks?.onSubscribed?.()
        } else if (status === REALTIME.SUBSCRIBE_STATES.CHANNEL_ERROR) {
          callbacks?.onError?.(new NexoraError(
            'Presence channel error',
            'realtime_presence_error'
          ))
        } else if (status === REALTIME.SUBSCRIBE_STATES.TIMED_OUT) {
          callbacks?.onTimedOut?.()
        } else if (status === REALTIME.SUBSCRIBE_STATES.CLOSED) {
          isTracked = false
          callbacks?.onClosed?.()
        }
      })

      return async () => {
        await channel.untrack()
        isTracked = false
        await channel.unsubscribe()
        await supabase.removeChannel(channel)
      }
    },

    async untrack() {
      await channel.untrack()
      isTracked = false
    },

    async unsubscribe() {
      try {
        await channel.untrack()
        await channel.unsubscribe()
      } finally {
        await supabase.removeChannel(channel)
        isTracked = false
      }
    },

    getState() {
      return channel.presenceState()
    },

    getPresenceCount() {
      return Object.keys(channel.presenceState()).length
    },

    isTracking() {
      return isTracked
    },
  }
}

export async function unsubscribe(handle: SubscriptionHandle | RealtimeChannel): Promise<void> {
  const supabase = getClient()
  if ('unsubscribe' in handle && typeof handle.unsubscribe === 'function' && 'isSubscribed' in handle) {
    await (handle as SubscriptionHandle).unsubscribe()
  } else {
    const channel = handle as RealtimeChannel
    await channel.unsubscribe()
    await supabase.removeChannel(channel)
  }
}

export async function unsubscribeAll(): Promise<void> {
  const supabase = getClient()
  const channels = Array.from(activeChannels.values())
  for (const info of channels) {
    try {
      await info.channel.unsubscribe()
    } catch {
      // Ignore unsubscribe errors
    }
  }
  activeChannels.clear()
  await supabase.removeAllChannels()
  updateConnectionState('disconnected')
}

export async function reconnect(): Promise<void> {
  const channels = Array.from(activeChannels.values())
  updateConnectionState('reconnecting')

  for (const info of channels) {
    try {
      info.channel.subscribe()
    } catch {
      // Ignore reconnect errors for individual channels
    }
  }

  updateConnectionState('connected')
}

export class RealtimeManager {
  private client: SupabaseClient
  private channels: Map<string, ChannelInfo>
  private connectionState: RealtimeConnectionState
  private connectionListeners: Set<(state: RealtimeConnectionState) => void>

  constructor() {
    this.client = getClient()
    this.channels = activeChannels
    this.connectionState = connectionState
    this.connectionListeners = connectionListeners
  }

  getChannelState(key: string): RealtimeChannelState | undefined {
    return this.channels.get(key)?.state
  }

  getChannels(): ChannelInfo[] {
    return Array.from(this.channels.values())
  }

  getSubscribedChannels(): ChannelInfo[] {
    return Array.from(this.channels.values()).filter(
      (info) => info.state === 'SUBSCRIBED'
    )
  }

  getConnectionState(): RealtimeConnectionState {
    return this.connectionState
  }

  onConnectionChange(callback: (state: RealtimeConnectionState) => void): () => void {
    this.connectionListeners.add(callback)
    callback(this.connectionState)
    return () => {
      this.connectionListeners.delete(callback)
    }
  }

  subscribeToTable<T extends Record<string, unknown>>(
    config: SubscriptionConfig,
    callbacks?: SubscriptionCallbacks<T>
  ): SubscriptionHandle {
    return subscribeToTable<T>(config, callbacks)
  }

  subscribeToRow<T extends Record<string, unknown>>(
    table: string,
    rowId: string | number,
    callbacks?: SubscriptionCallbacks<T>,
    options?: { schema?: string; events?: RealtimeEvent[]; channelName?: string; timeout?: number }
  ): SubscriptionHandle {
    return subscribeToRow<T>(table, rowId, callbacks, options)
  }

  createBroadcastChannel(name: string): BroadcastChannelHandle {
    return createBroadcastChannel(name)
  }

  createPresenceChannel(name: string): PresenceChannelHandle {
    return createPresenceChannel(name)
  }

  async unsubscribe(handle: SubscriptionHandle | RealtimeChannel): Promise<void> {
    return unsubscribe(handle)
  }

  async unsubscribeAll(): Promise<void> {
    return unsubscribeAll()
  }

  async reconnect(): Promise<void> {
    return reconnect()
  }

  destroy(): void {
    this.channels.clear()
    this.connectionListeners.clear()
  }
}

export const realtime = new RealtimeManager()
