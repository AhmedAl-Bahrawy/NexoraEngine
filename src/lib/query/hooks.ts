import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { fetchAll, insertOne, updateById, deleteById } from '../database'
import { subscribeToTable, unsubscribe } from '../database/realtime'
import {
  createTeam,
  getUserTeams,
  getTeamMembers,
  addTeamMember,
  updateMemberRole,
  removeTeamMember,
  leaveTeam,
  subscribeToTeam,
  unsubscribeFromTeam,
} from '../database/teams'
import { queryKeys, invalidate } from './keys'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ==================== TODOS ====================

interface Todo {
  id: string
  user_id: string
  team_id: string | null
  title: string
  completed: boolean
  created_at: string
}

export function usePersonalTodos(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.todos.personal(userId || ''),
    queryFn: async () => {
      if (!userId) return []
      const data = await fetchAll<Todo>('todos', {
        filter: (q) => q.eq('user_id', userId).is('team_id', null),
        order: { column: 'created_at', ascending: false },
      })
      return data
    },
    enabled: !!userId,
  })
}

export function useTeamTodos(teamId: string | null) {
  return useQuery({
    queryKey: queryKeys.todos.team(teamId || ''),
    queryFn: async () => {
      if (!teamId) return []
      const data = await fetchAll<Todo>('todos', {
        filter: (q) => q.eq('team_id', teamId),
        order: { column: 'created_at', ascending: false },
      })
      return data
    },
    enabled: !!teamId,
  })
}

export function usePersonalTodosRealtime(userId: string | undefined) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!userId) return

    const channel = subscribeToTable<Todo>(
      { table: 'todos', filter: `user_id=eq.${userId}` },
      {
        onInsert: (data) => {
          if (!data.team_id) {
            queryClient.setQueryData(queryKeys.todos.personal(userId), (old: Todo[] | undefined) =>
              old ? [data, ...old] : [data]
            )
          }
        },
        onUpdate: (data) => {
          if (!data.team_id) {
            queryClient.setQueryData(queryKeys.todos.personal(userId), (old: Todo[] | undefined) =>
              old ? old.map(t => t.id === data.id ? data : t) : old
            )
          }
        },
        onDelete: (data) => {
          if (!data.team_id) {
            queryClient.setQueryData(queryKeys.todos.personal(userId), (old: Todo[] | undefined) =>
              old ? old.filter(t => t.id !== data.id) : old
            )
          }
        },
      }
    )
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        unsubscribe(channelRef.current)
      }
    }
  }, [userId, queryClient])
}

export function useTeamTodosRealtime(teamId: string | null) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!teamId) return

    const channel = subscribeToTable<Todo>(
      { table: 'todos', filter: `team_id=eq.${teamId}` },
      {
        onInsert: (data) => {
          queryClient.setQueryData(queryKeys.todos.team(teamId), (old: Todo[] | undefined) =>
            old ? [data, ...old] : [data]
          )
        },
        onUpdate: (data) => {
          queryClient.setQueryData(queryKeys.todos.team(teamId), (old: Todo[] | undefined) =>
            old ? old.map(t => t.id === data.id ? data : t) : old
          )
        },
        onDelete: (data) => {
          queryClient.setQueryData(queryKeys.todos.team(teamId), (old: Todo[] | undefined) =>
            old ? old.filter(t => t.id !== data.id) : old
          )
        },
      }
    )
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        unsubscribe(channelRef.current)
      }
    }
  }, [teamId, queryClient])
}

export function useCreateTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, userId, teamId }: { title: string; userId: string; teamId?: string | null }) => {
      return insertOne<Todo>('todos', {
        title,
        completed: false,
        user_id: userId,
        team_id: teamId || null,
      })
    },
    onSuccess: (newTodo) => {
      if (newTodo.team_id) {
        queryClient.setQueryData(queryKeys.todos.team(newTodo.team_id), (old: Todo[] | undefined) =>
          old ? [newTodo, ...old] : [newTodo]
        )
      } else {
        queryClient.setQueryData(queryKeys.todos.personal(newTodo.user_id), (old: Todo[] | undefined) =>
          old ? [newTodo, ...old] : [newTodo]
        )
      }
    },
  })
}

export function useToggleTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return updateById<Todo>('todos', id, { completed: !completed })
    },
    onSuccess: (updated) => {
      if (updated.team_id) {
        queryClient.setQueryData(queryKeys.todos.team(updated.team_id), (old: Todo[] | undefined) =>
          old ? old.map(t => t.id === updated.id ? updated : t) : old
        )
      } else {
        queryClient.setQueryData(queryKeys.todos.personal(updated.user_id), (old: Todo[] | undefined) =>
          old ? old.map(t => t.id === updated.id ? updated : t) : old
        )
      }
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, userId, teamId }: { id: string; userId: string; teamId?: string | null }) => {
      await deleteById('todos', id)
      return { id, userId, teamId }
    },
    onSuccess: (_, vars) => {
      if (vars.teamId) {
        queryClient.setQueryData(queryKeys.todos.team(vars.teamId), (old: Todo[] | undefined) =>
          old ? old.filter(t => t.id !== vars.id) : old
        )
      } else {
        queryClient.setQueryData(queryKeys.todos.personal(vars.userId), (old: Todo[] | undefined) =>
          old ? old.filter(t => t.id !== vars.id) : old
        )
      }
    },
  })
}

// ==================== TEAMS ====================

export function useUserTeams(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teams.user(userId || ''),
    queryFn: async () => {
      if (!userId) return []
      return getUserTeams()
    },
    enabled: !!userId,
  })
}

export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teamMembers.byTeam(teamId || ''),
    queryFn: async () => {
      if (!teamId) return []
      return getTeamMembers(teamId)
    },
    enabled: !!teamId,
  })
}

export function useTeamMembersRealtime(teamId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!teamId) return

    const channel = subscribeToTeam(teamId, {
      onMemberChange: () => {
        invalidate.teamMembers(teamId)
      },
      onTodoInsert: () => {},
      onTodoUpdate: () => {},
      onTodoDelete: () => {},
    })

    return () => {
      unsubscribeFromTeam(channel)
    }
  }, [teamId, queryClient])
}

export function useCreateTeam() {
  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      return createTeam({ name })
    },
    onSuccess: () => {
      invalidate.teamsAll()
    },
  })
}

export function useAddTeamMember() {
  return useMutation({
    mutationFn: async ({ teamId, userId, role }: { teamId: string; userId: string; role?: 'admin' | 'member' }) => {
      return addTeamMember({ teamId, userId, role })
    },
    onSuccess: (_, vars) => {
      invalidate.teamMembers(vars.teamId)
    },
  })
}

export function useUpdateMemberRole() {
  return useMutation({
    mutationFn: async ({ teamId, userId, role }: { teamId: string; userId: string; role: 'owner' | 'admin' | 'member' }) => {
      return updateMemberRole(teamId, userId, role)
    },
    onSuccess: (_, vars) => {
      invalidate.teamMembers(vars.teamId)
    },
  })
}

export function useRemoveTeamMember() {
  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      return removeTeamMember(teamId, userId)
    },
    onSuccess: (_, vars) => {
      invalidate.teamMembers(vars.teamId)
    },
  })
}

export function useLeaveTeam() {
  return useMutation({
    mutationFn: async (teamId: string) => {
      return leaveTeam(teamId)
    },
    onSuccess: () => {
      invalidate.teamsAll()
    },
  })
}

// ==================== STORAGE FILES ====================

interface StorageFileRecord {
  id: string
  user_id: string
  team_id: string | null
  bucket_id: string
  path: string
  file_name: string
  file_size: number | null
  content_type: string | null
  public_url: string | null
  created_at: string
  updated_at: string
}

export function usePersonalStorageFiles(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.storageFiles.personal(userId || ''),
    queryFn: async () => {
      if (!userId) return []
      return fetchAll<StorageFileRecord>('storage_files', {
        filter: (q) => q.eq('user_id', userId).is('team_id', null),
        order: { column: 'created_at', ascending: false },
      })
    },
    enabled: !!userId,
  })
}

export function useTeamStorageFiles(teamId: string | null) {
  return useQuery({
    queryKey: queryKeys.storageFiles.team(teamId || ''),
    queryFn: async () => {
      if (!teamId) return []
      return fetchAll<StorageFileRecord>('storage_files', {
        filter: (q) => q.eq('team_id', teamId),
        order: { column: 'created_at', ascending: false },
      })
    },
    enabled: !!teamId,
  })
}

export function useStorageFilesRealtime(userId: string | undefined, _teamId: string | null) {
  useEffect(() => {
    if (!userId) return

    const channel = subscribeToTable<StorageFileRecord>(
      { table: 'storage_files', filter: `user_id=eq.${userId}` },
      {
        onInsert: () => { invalidate.storageFilesAll() },
        onUpdate: () => { invalidate.storageFilesAll() },
        onDelete: () => { invalidate.storageFilesAll() },
      }
    )

    return () => {
      unsubscribe(channel)
    }
  }, [userId, _teamId])
}

export function useCreateStorageFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<StorageFileRecord, 'id' | 'created_at' | 'updated_at'>) => {
      return insertOne<StorageFileRecord>('storage_files', data)
    },
    onSuccess: (file) => {
      if (file.team_id) {
        queryClient.setQueryData(queryKeys.storageFiles.team(file.team_id), (old: StorageFileRecord[] | undefined) =>
          old ? [file, ...old] : [file]
        )
      } else {
        queryClient.setQueryData(queryKeys.storageFiles.personal(file.user_id), (old: StorageFileRecord[] | undefined) =>
          old ? [file, ...old] : [file]
        )
      }
    },
  })
}

export function useDeleteStorageFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, userId, teamId }: { id: string; userId: string; teamId?: string | null }) => {
      await deleteById('storage_files', id)
      return { id, userId, teamId }
    },
    onSuccess: (_, vars) => {
      if (vars.teamId) {
        queryClient.setQueryData(queryKeys.storageFiles.team(vars.teamId), (old: StorageFileRecord[] | undefined) =>
          old ? old.filter(f => f.id !== vars.id) : old
        )
      } else {
        queryClient.setQueryData(queryKeys.storageFiles.personal(vars.userId), (old: StorageFileRecord[] | undefined) =>
          old ? old.filter(f => f.id !== vars.id) : old
        )
      }
    },
  })
}
