/**
 * Team Management Operations
 * Create, join, manage teams with team-based realtime sync
 */

import { supabase } from '../auth/client'
import { handleSupabaseError } from '../utils/errors'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Types
export interface Team {
  id: string
  name: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  user_email?: string
}

export interface CreateTeamParams {
  name: string
}

export interface AddMemberParams {
  teamId: string
  userId: string
  role?: 'admin' | 'member'
}

// Create a new team (creator becomes owner)
export async function createTeam(
  params: CreateTeamParams
): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert({ name: params.name })
    .select()
    .single()

  if (error) throw handleSupabaseError(error)
  return data as Team
}

// Get all teams the current user belongs to
export async function getUserTeams(): Promise<(Team & { role: string })[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      role,
      teams (
        id,
        name,
        created_by,
        created_at,
        updated_at
      )
    `)

  if (error) throw handleSupabaseError(error)

  return (data || []).map((item: any) => ({
    ...item.teams,
    role: item.role,
  }))
}

// Get members of a specific team
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      id,
      team_id,
      user_id,
      role,
      joined_at,
      user_email: user_id (email)
    `)
    .eq('team_id', teamId)

  if (error) throw handleSupabaseError(error)

  return (data || []).map((item: any) => ({
    id: item.id,
    team_id: item.team_id,
    user_id: item.user_id,
    role: item.role,
    joined_at: item.joined_at,
    user_email: item.user_email?.email,
  }))
}

// Add a member to a team
export async function addTeamMember(params: AddMemberParams): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      team_id: params.teamId,
      user_id: params.userId,
      role: params.role || 'member',
    })
    .select()
    .single()

  if (error) throw handleSupabaseError(error)
  return data as TeamMember
}

// Update a member's role
export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member'
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .update({ role })
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw handleSupabaseError(error)
  return data as TeamMember
}

// Remove a member from a team
export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (error) throw handleSupabaseError(error)
}

// Leave a team (self)
export async function leaveTeam(teamId: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)

  if (error) throw handleSupabaseError(error)
}

// Delete a team (owner only, cascades to members)
export async function deleteTeam(teamId: string): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId)

  if (error) throw handleSupabaseError(error)
}

// Get team by ID
export async function getTeamById(teamId: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw handleSupabaseError(error)
  }
  return data as Team
}

// Subscribe to team realtime changes (todos + members)
export function subscribeToTeam(
  teamId: string,
  callbacks: {
    onTodoInsert?: (data: any) => void
    onTodoUpdate?: (data: any) => void
    onTodoDelete?: (data: any) => void
    onMemberChange?: () => void
  }
): RealtimeChannel[] {
  const channels: RealtimeChannel[] = []

  // Subscribe to team todos
  const todoChannel = supabase
    .channel(`team-todos-${teamId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'todos',
        filter: `team_id=eq.${teamId}`,
      },
      (payload) => {
        callbacks.onTodoInsert?.(payload.new)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'todos',
        filter: `team_id=eq.${teamId}`,
      },
      (payload) => {
        callbacks.onTodoUpdate?.(payload.new)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'todos',
        filter: `team_id=eq.${teamId}`,
      },
      (payload) => {
        callbacks.onTodoDelete?.(payload.old)
      }
    )
    .subscribe()

  channels.push(todoChannel)

  // Subscribe to team member changes
  const memberChannel = supabase
    .channel(`team-members-${teamId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'team_members',
        filter: `team_id=eq.${teamId}`,
      },
      () => {
        callbacks.onMemberChange?.()
      }
    )
    .subscribe()

  channels.push(memberChannel)

  return channels
}

// Unsubscribe from team channels
export async function unsubscribeFromTeam(channels: RealtimeChannel[]): Promise<void> {
  for (const channel of channels) {
    await supabase.removeChannel(channel)
  }
}
