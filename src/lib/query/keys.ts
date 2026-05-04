import { queryClient } from './client'

export const queryKeys = {
  all: ['supabase'] as const,

  todos: {
    all: ['supabase', 'todos'] as const,
    personal: (userId: string) => ['supabase', 'todos', 'personal', userId] as const,
    team: (teamId: string) => ['supabase', 'todos', 'team', teamId] as const,
    detail: (id: string) => ['supabase', 'todos', 'detail', id] as const,
  },

  teams: {
    all: ['supabase', 'teams'] as const,
    user: (userId: string) => ['supabase', 'teams', 'user', userId] as const,
    detail: (teamId: string) => ['supabase', 'teams', 'detail', teamId] as const,
  },

  teamMembers: {
    all: ['supabase', 'team-members'] as const,
    byTeam: (teamId: string) => ['supabase', 'team-members', teamId] as const,
  },

  storageFiles: {
    all: ['supabase', 'storage-files'] as const,
    personal: (userId: string) => ['supabase', 'storage-files', 'personal', userId] as const,
    team: (teamId: string) => ['supabase', 'storage-files', 'team', teamId] as const,
  },
}

export const invalidate = {
  todos: (type: 'personal' | 'team', id: string) => {
    if (type === 'personal') {
      return queryClient.invalidateQueries({ queryKey: queryKeys.todos.personal(id) })
    }
    return queryClient.invalidateQueries({ queryKey: queryKeys.todos.team(id) })
  },
  todosAll: () => queryClient.invalidateQueries({ queryKey: queryKeys.todos.all }),
  teams: (userId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.teams.user(userId) }),
  teamsAll: () => queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
  teamMembers: (teamId: string) => queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers.byTeam(teamId) }),
  storageFiles: (type: 'personal' | 'team', id: string) => {
    if (type === 'personal') {
      return queryClient.invalidateQueries({ queryKey: queryKeys.storageFiles.personal(id) })
    }
    return queryClient.invalidateQueries({ queryKey: queryKeys.storageFiles.team(id) })
  },
  storageFilesAll: () => queryClient.invalidateQueries({ queryKey: queryKeys.storageFiles.all }),
}
