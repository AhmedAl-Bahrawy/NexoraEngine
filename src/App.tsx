import { useState, useEffect } from 'react'
import {
  supabase,
  signInWithPassword,
  signUp,
  signOut,
  signInWithOAuth,
  signInWithOTP
} from './lib/auth'
import { uploadFileWithProgress, getPublicUrl, deleteFile, downloadFile } from './lib/storage'
import { formatErrorForDisplay } from './lib/utils'
import {
  usePersonalTodos,
  useTeamTodos,
  usePersonalTodosRealtime,
  useTeamTodosRealtime,
  useCreateTodo,
  useToggleTodo,
  useDeleteTodo,
  useUserTeams,
  useTeamMembers,
  useCreateTeam,
  useLeaveTeam,
  usePersonalStorageFiles,
  useTeamStorageFiles,
  useStorageFilesRealtime,
  useCreateStorageFile,
  useDeleteStorageFile,
} from './lib/query'
import type { User } from '@supabase/supabase-js'
import './App.css'

type View = 'home' | 'auth' | 'database' | 'storage' | 'realtime'

interface OnlineUser {
  userId: string
  email?: string
  online_at: string
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const GitHubIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
  </svg>
)

function App() {
  const [currentView, setCurrentView] = useState<View>('home')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [newTodo, setNewTodo] = useState('')
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ percentage: number; loadedMB: string; remainingMB: string; fileName: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [newTeamName, setNewTeamName] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])

  const isPersonal = !selectedTeamId

  const { data: personalTodos = [], isLoading: personalTodosLoading } = usePersonalTodos(user?.id)
  const { data: teamTodos = [], isLoading: teamTodosLoading } = useTeamTodos(selectedTeamId)
  const { data: teams = [], isLoading: teamsLoading } = useUserTeams(user?.id)
  const { data: teamMembers = [] } = useTeamMembers(selectedTeamId ?? undefined)
  const { data: personalFiles = [] } = usePersonalStorageFiles(user?.id)
  const { data: teamFiles = [] } = useTeamStorageFiles(selectedTeamId)

  usePersonalTodosRealtime(user?.id)
  useTeamTodosRealtime(selectedTeamId)
  useStorageFilesRealtime(user?.id, selectedTeamId)

  const createTodo = useCreateTodo()
  const toggleTodo = useToggleTodo()
  const deleteTodo = useDeleteTodo()
  const createTeam = useCreateTeam()
  const leaveTeam = useLeaveTeam()
  const createStorageFile = useCreateStorageFile()
  const deleteStorageFile = useDeleteStorageFile()

  const todos = isPersonal ? personalTodos : teamTodos
  const todosLoading = isPersonal ? personalTodosLoading : teamTodosLoading
  const files = isPersonal ? personalFiles : teamFiles

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: OnlineUser[] = []
        for (const key in state) {
          const presences = state[key] as any[]
          for (const p of presences) {
            users.push({ userId: p.userId, email: p.email, online_at: p.online_at })
          }
        }
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const users = [...onlineUsers]
        for (const p of newPresences as any[]) {
          users.push({ userId: p.userId, email: p.email, online_at: p.online_at })
        }
        setOnlineUsers(users)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftIds = new Set((leftPresences as any[]).map(p => p.userId))
        setOnlineUsers(prev => prev.filter(u => !leftIds.has(u.userId)))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId: user.id, email: user.email, online_at: new Date().toISOString() })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [user, onlineUsers])

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signInWithPassword({ email, password })
      setError(null)
    } catch (err) {
      setError(formatErrorForDisplay(err).message)
    }
  }

  const handleSignUp = async (email: string, password: string) => {
    try {
      await signUp({ email, password })
      return { success: true, message: 'Account created! Check your email to confirm.' }
    } catch (err) {
      setError(formatErrorForDisplay(err).message)
      return { success: false }
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
    setSelectedTeamId(null)
  }

  const handleGoogleSignIn = async () => {
    try { await signInWithOAuth('google') } catch (err) { setError(formatErrorForDisplay(err).message) }
  }

  const handleGitHubSignIn = async () => {
    try { await signInWithOAuth('github') } catch (err) { setError(formatErrorForDisplay(err).message) }
  }

  const handleMagicLink = async (email: string) => {
    try {
      await signInWithOTP(email)
      setError(null)
      setSuccessMessage('Magic link sent! Check your email.')
    } catch (err) {
      setError(formatErrorForDisplay(err).message)
    }
  }

  const handleAddTodo = async () => {
    if (!newTodo.trim() || !user) return
    try {
      await createTodo.mutateAsync({
        title: newTodo,
        userId: user.id,
        teamId: selectedTeamId || undefined,
      })
      setNewTodo('')
    } catch {
      setError('Failed to add todo')
    }
  }

  const handleToggleTodo = (id: string, completed: boolean) => {
    toggleTodo.mutate({ id, completed })
  }

  const handleDeleteTodo = (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo || !user) return
    deleteTodo.mutate({ id, userId: user.id, teamId: todo.team_id })
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !user) return
    try {
      await createTeam.mutateAsync({ name: newTeamName })
      setNewTeamName('')
      setSuccessMessage(`Team "${newTeamName}" created!`)
    } catch {
      setError('Failed to create team')
    }
  }

  const handleLeaveTeam = async () => {
    if (!selectedTeamId) return
    try {
      await leaveTeam.mutateAsync(selectedTeamId)
      setSelectedTeamId(null)
      setSuccessMessage('Left team')
    } catch {
      setError('Failed to leave team')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setIsUploading(true)
    setUploadProgress({ percentage: 0, loadedMB: '0.00', remainingMB: (file.size / (1024 * 1024)).toFixed(2), fileName: file.name })
    setError(null)

    try {
      const path = `${user.id}/${Date.now()}_${file.name}`
      await uploadFileWithProgress('test', path, file, (progress) => {
        setUploadProgress({ percentage: progress.percentage, loadedMB: progress.loadedMB, remainingMB: progress.remainingMB, fileName: file.name })
      })

      const url = getPublicUrl('test', path)
      setUploadedFile(url)
      setSuccessMessage('File uploaded successfully!')

      await createStorageFile.mutateAsync({
        user_id: user.id,
        team_id: selectedTeamId,
        bucket_id: 'test',
        path,
        file_name: file.name,
        file_size: file.size,
        content_type: file.type,
        public_url: url,
      })
    } catch {
      setError('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (!file || !user) return
    try {
      await deleteFile(file.bucket_id, file.path)
      await deleteStorageFile.mutateAsync({ id: fileId, userId: user.id, teamId: file.team_id })
      setSuccessMessage('File deleted!')
    } catch {
      setError('Failed to delete file')
    }
  }

  const handleDownloadFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (!file) return
    try {
      const blob = await downloadFile(file.bucket_id, file.path)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError('Failed to download file')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Supabase Pro</h1>
              </div>
              <div className="hidden md:flex items-center gap-1">
                {[
                  { id: 'home', label: 'Home', icon: '🏠' },
                  { id: 'auth', label: 'Auth', icon: '🔐' },
                  { id: 'database', label: 'Database', icon: '📊' },
                  { id: 'storage', label: 'Storage', icon: '☁️' },
                  { id: 'realtime', label: 'Realtime', icon: '⚡' },
                ].map(item => (
                  <button key={item.id} onClick={() => setCurrentView(item.id as View)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      currentView === item.id ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}>
                    <span>{item.icon}</span>{item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {user.email?.split('@')[0]}
                  </div>
                  <button onClick={handleSignOut} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium">Sign Out</button>
                </div>
              ) : (
                <button onClick={() => setCurrentView('auth')} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-medium">Sign In</button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Toast */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-center gap-3 animate-in slide-in-from-top-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 font-medium">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {/* Success Toast */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg flex items-center gap-3 animate-in slide-in-from-top-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-700 font-medium">{successMessage}</p>
            <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-500 hover:text-green-700">✕</button>
          </div>
        )}

        {/* Home View */}
        {currentView === 'home' && (
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-12 shadow-2xl">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-4xl font-bold mb-4">Welcome to Supabase Pro Template</h2>
                <p className="text-xl text-blue-100 mb-8">A complete, production-ready template with modern authentication, team collaboration, real-time database, and intelligent file storage.</p>
                <button onClick={() => setCurrentView('auth')} className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-xl transition-all duration-200 hover:scale-105">Get Started →</button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Authentication', desc: 'Email, Google, GitHub, Magic Link', icon: '🔐', gradient: 'from-blue-500 to-blue-600', view: 'auth' as View },
                { title: 'Database', desc: 'CRUD, Teams, Real-time sync', icon: '📊', gradient: 'from-green-500 to-emerald-600', view: 'database' as View },
                { title: 'Storage', desc: 'Upload with progress tracking', icon: '☁️', gradient: 'from-purple-500 to-violet-600', view: 'storage' as View },
                { title: 'Real-time', desc: 'Live updates & presence', icon: '⚡', gradient: 'from-orange-500 to-red-600', view: 'realtime' as View },
              ].map((feature, i) => (
                <div key={i} onClick={() => setCurrentView(feature.view)} className="group p-6 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-transparent hover:-translate-y-1 cursor-pointer">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>{feature.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auth View */}
        {currentView === 'auth' && (
          <div className="max-w-md mx-auto">
            {user ? (
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Signed In!</h2>
                  <p className="text-gray-600 mb-6">{user?.email}</p>
                  <button onClick={handleSignOut} className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200">Sign Out</button>
                </div>
              </div>
            ) : (
              <AuthForms onSignIn={handleSignIn} onSignUp={handleSignUp} onGoogleSignIn={handleGoogleSignIn} onGitHubSignIn={handleGitHubSignIn} onMagicLink={handleMagicLink} />
            )}
          </div>
        )}

        {/* Database View with Teams */}
        {currentView === 'database' && (
          <div className="flex gap-6 max-w-6xl mx-auto">
            {/* Team Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📂</span> Workspaces
                </h3>

                <button onClick={() => setSelectedTeamId(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all mb-2 flex items-center gap-2 ${
                    isPersonal ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  <span>👤</span> Personal
                  <span className="ml-auto text-xs text-gray-400">{todosLoading ? '...' : personalTodos.length}</span>
                </button>

                <div className="border-t border-gray-100 my-2" />

                {teamsLoading && <p className="text-sm text-gray-400 py-2">Loading teams...</p>}

                {teams.map(team => (
                  <button key={team.id} onClick={() => setSelectedTeamId(team.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all mb-1 flex items-center gap-2 ${
                      selectedTeamId === team.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    <span>👥</span>
                    <span className="truncate flex-1">{team.name}</span>
                  </button>
                ))}

                {/* Create Team */}
                <div className="border-t border-gray-100 my-2" />
                <div className="space-y-2">
                  <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
                    placeholder="New team name..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handleCreateTeam} disabled={createTeam.isPending}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
                    {createTeam.isPending ? 'Creating...' : 'Create Team'}
                  </button>
                </div>

                {/* Leave Team */}
                {selectedTeamId && (
                  <>
                    <div className="border-t border-gray-100 my-2" />
                    <button onClick={handleLeaveTeam} disabled={leaveTeam.isPending}
                      className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50">
                      Leave Team
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Main Todo Area */}
            <div className="flex-1">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <span className="text-3xl">{isPersonal ? '📊' : '👥'}</span>
                    {isPersonal ? 'Personal Todos' : teams.find(t => t.id === selectedTeamId)?.name}
                  </h2>
                  <p className="text-blue-100 mt-1">
                    {isPersonal ? 'Your personal tasks' : `${teamMembers.length} member${teamMembers.length !== 1 ? 's' : ''} • Real-time synced`}
                  </p>
                </div>

                <div className="p-6">
                  {/* Team Members Bar */}
                  {!isPersonal && teamMembers.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500 font-medium">Members:</span>
                      {teamMembers.map(member => (
                        <div key={member.user_id} className="flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs border border-gray-200">
                          <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold" style={{ fontSize: '8px' }}>
                            {member.user_email?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-700">{member.user_email?.split('@')[0]}</span>
                          <span className={`px-1 rounded text-xs ${member.role === 'owner' ? 'bg-yellow-100 text-yellow-700' : member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>{member.role}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Todo */}
                  <div className="flex gap-3 mb-6">
                    <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                      placeholder={isPersonal ? "What needs to be done?" : "Add a team todo..."}
                      className="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                    <button onClick={handleAddTodo} disabled={createTodo.isPending || !newTodo.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100">
                      {createTodo.isPending ? 'Adding...' : 'Add'}
                    </button>
                  </div>

                  {/* Todo List */}
                  <div className="space-y-2">
                    {todosLoading && <p className="text-center text-gray-400 py-8">Loading...</p>}
                    {!todosLoading && todos.map(todo => (
                      <div key={todo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                        <div className="flex items-center gap-4">
                          <button onClick={() => handleToggleTodo(todo.id, todo.completed)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              todo.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-400'
                            }`}>
                            {todo.completed && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>}
                          </button>
                          <span className={`font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{todo.title}</span>
                        </div>
                        <button onClick={() => handleDeleteTodo(todo.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {!todosLoading && todos.length === 0 && (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📝</div>
                        <p className="text-gray-500">{isPersonal ? 'No personal todos yet.' : 'No team todos yet.'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Storage View */}
        {currentView === 'storage' && (
          <div className="flex gap-6 max-w-6xl mx-auto">
            {/* Team Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span>📂</span> Workspaces</h3>
                <button onClick={() => setSelectedTeamId(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all mb-2 flex items-center gap-2 ${
                    isPersonal ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  <span>👤</span> Personal
                  <span className="ml-auto text-xs text-gray-400">{personalFiles.length}</span>
                </button>
                <div className="border-t border-gray-100 my-2" />
                {teams.map(team => (
                  <button key={team.id} onClick={() => setSelectedTeamId(team.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all mb-1 flex items-center gap-2 ${
                      selectedTeamId === team.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    <span>👥</span><span className="truncate flex-1">{team.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Storage Area */}
            <div className="flex-1">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-8 bg-gradient-to-r from-purple-600 to-violet-600 text-white">
                  <h2 className="text-2xl font-bold flex items-center gap-3"><span className="text-3xl">☁️</span> File Storage</h2>
                  <p className="text-purple-100 mt-1">{isPersonal ? 'Personal files' : `Team files — ${teams.find(t => t.id === selectedTeamId)?.name}`}</p>
                </div>

                <div className="p-8">
                  {!user ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">🔒</span></div>
                      <p className="text-gray-600 mb-4">Please sign in to upload files</p>
                      <button onClick={() => setCurrentView('auth')} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold">Sign In to Continue</button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Upload Area */}
                      <div className="relative">
                        <input type="file" onChange={handleFileUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all ${isUploading ? 'border-purple-300 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'}`}>
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <p className="font-semibold text-gray-700 mb-1">{isUploading ? 'Uploading...' : 'Drop your file here or click to browse'}</p>
                          <p className="text-sm text-gray-500">Supports images, documents, and more</p>
                        </div>
                      </div>

                      {/* Upload Progress */}
                      {isUploading && uploadProgress && (
                        <div className="bg-purple-50 rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><span className="text-xl">📄</span></div>
                              <div><p className="font-semibold text-gray-900 truncate max-w-xs">{uploadProgress.fileName}</p>
                                <p className="text-sm text-gray-500">{uploadProgress.loadedMB} MB / {parseFloat(uploadProgress.loadedMB) + parseFloat(uploadProgress.remainingMB)} MB</p></div>
                            </div>
                            <span className="text-2xl font-bold text-purple-600">{uploadProgress.percentage}%</span>
                          </div>
                          <div className="relative h-3 bg-purple-200 rounded-full overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress.percentage}%` }}>
                              <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-purple-700 font-medium">{uploadProgress.loadedMB} MB uploaded</span>
                            <span className="text-gray-500">{uploadProgress.remainingMB} MB remaining</span>
                          </div>
                        </div>
                      )}

                      {/* Upload Success */}
                      {uploadedFile && !isUploading && (
                        <div className="bg-green-50 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div><p className="font-semibold text-green-900">Upload Complete!</p><p className="text-sm text-green-700">File uploaded successfully</p></div>
                          </div>
                          <a href={uploadedFile} target="_blank" rel="noopener noreferrer" className="block p-4 bg-white rounded-xl break-all text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors border border-green-200">{uploadedFile}</a>
                        </div>
                      )}

                      {/* Files List */}
                      {files.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2"><span>📁</span> Your Files ({files.length})</h3>
                          <div className="space-y-2">
                            {files.map(fileRecord => (
                              <div key={fileRecord.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-lg">📄</span></div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{fileRecord.file_name}</p>
                                    <p className="text-xs text-gray-500">{fileRecord.file_size ? `${(fileRecord.file_size / 1024).toFixed(1)} KB • ` : ''}{new Date(fileRecord.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {fileRecord.public_url && (
                                    <a href={fileRecord.public_url} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </a>
                                  )}
                                  <button onClick={() => handleDownloadFile(fileRecord.id)} className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Download">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </button>
                                  <button onClick={() => handleDeleteFile(fileRecord.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {files.length === 0 && !isUploading && user && (
                        <div className="text-center py-12"><div className="text-6xl mb-4">📂</div><p className="text-gray-500">No files yet. Upload one above!</p></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Realtime View */}
        {currentView === 'realtime' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Online Users */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 bg-gradient-to-r from-orange-500 to-red-600 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-3"><span className="text-3xl">⚡</span> Realtime Presence</h2>
                <p className="text-orange-100 mt-1">See who's online across all tabs</p>
              </div>
              <div className="p-6">
                {!user ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">🔒</span></div>
                    <p className="text-gray-600 mb-4">Please sign in to see online users</p>
                    <button onClick={() => setCurrentView('auth')} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold">Sign In to Continue</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-medium text-green-900">You are online</span>
                      <span className="text-sm text-green-700 ml-auto">{user.email}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2"><span>👥</span> Online Users ({onlineUsers.length})</h3>
                    <div className="grid gap-3">
                      {onlineUsers.map((u, i) => (
                        <div key={`${u.userId}-${i}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">{u.email?.charAt(0).toUpperCase()}</div>
                          <div className="flex-1"><p className="font-medium text-gray-900">{u.email || 'Anonymous'}</p><p className="text-xs text-gray-500">Last seen: {new Date(u.online_at).toLocaleTimeString()}</p></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </div>
                      ))}
                      {onlineUsers.length === 1 && <div className="text-center py-8 text-gray-500">Only you are online</div>}
                      {onlineUsers.length === 0 && <div className="text-center py-8 text-gray-500">No users online</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Realtime Todo Sync */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-3"><span className="text-3xl">🔄</span> Realtime Todo Sync</h2>
                <p className="text-blue-100 mt-1">Changes appear instantly across all tabs</p>
              </div>
              <div className="p-6">
                {!user ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">🔒</span></div>
                    <p className="text-gray-600 mb-4">Please sign in to use realtime todos</p>
                    <button onClick={() => setCurrentView('auth')} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold">Sign In to Continue</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-blue-900">Realtime sync active</span>
                      <span className="text-xs text-blue-700 ml-auto">{personalTodos.length} todos</span>
                    </div>
                    <div className="flex gap-3">
                      <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                        placeholder="Add a todo (appears in all tabs)..."
                        className="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                      <button onClick={handleAddTodo} disabled={createTodo.isPending}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105 disabled:opacity-50">
                        {createTodo.isPending ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {personalTodos.map(todo => (
                        <div key={todo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                          <div className="flex items-center gap-4">
                            <button onClick={() => handleToggleTodo(todo.id, todo.completed)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${todo.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-400'}`}>
                              {todo.completed && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </button>
                            <span className={`font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{todo.title}</span>
                          </div>
                          <button onClick={() => handleDeleteTodo(todo.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                      {personalTodos.length === 0 && (
                        <div className="text-center py-12"><div className="text-6xl mb-4">📝</div><p className="text-gray-500">No todos yet. Add one above!</p></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function AuthForms({ onSignIn, onSignUp, onGoogleSignIn, onGitHubSignIn, onMagicLink }: {
  onSignIn: (email: string, password: string) => void
  onSignUp: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  onGoogleSignIn: () => void
  onGitHubSignIn: () => void
  onMagicLink: (email: string) => void
}) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isMagicLink, setIsMagicLink] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isMagicLink) {
      onMagicLink(email)
      setMagicLinkSent(true)
    } else if (isSignUp) {
      const result = await onSignUp(email, password)
      if (result.success && result.message) {
        setSignUpSuccess(result.message)
        setIsSignUp(false)
      }
    } else {
      onSignIn(email, password)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
        <p className="text-gray-600 mb-6">We've sent a magic link to <strong>{email}</strong>. Click the link to sign in instantly.</p>
        <button onClick={() => { setMagicLinkSent(false); setIsMagicLink(false); }} className="text-blue-600 hover:text-blue-800 font-medium">Back to Sign In</button>
      </div>
    )
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      {signUpSuccess && !isSignUp && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div><p className="font-semibold text-green-900">Success!</p><p className="text-sm text-green-700">{signUpSuccess}</p></div>
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{isMagicLink ? 'Sign In with Magic Link' : isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
      {!isMagicLink && (
        <div className="space-y-3 mb-6">
          <button onClick={onGoogleSignIn} className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"><GoogleIcon />Continue with Google</button>
          <button onClick={onGitHubSignIn} className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"><GitHubIcon />Continue with GitHub</button>
        </div>
      )}
      {!isMagicLink && (
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with email</span></div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
        </div>
        {!isMagicLink && (
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required={!isMagicLink} minLength={6} />
            {isSignUp && <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>}
          </div>
        )}
        <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
          {isMagicLink ? 'Send Magic Link' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      <div className="mt-6 text-center space-y-2">
        {!isSignUp && !isMagicLink && <button onClick={() => setIsMagicLink(true)} className="block w-full text-sm text-blue-600 hover:text-blue-800 font-medium">Sign in with Magic Link (no password)</button>}
        {isMagicLink && <button onClick={() => setIsMagicLink(false)} className="block w-full text-sm text-blue-600 hover:text-blue-800 font-medium">Sign in with password</button>}
        <p className="text-sm text-gray-600">{isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setIsMagicLink(false); }} className="text-blue-600 hover:text-blue-800 font-medium">{isSignUp ? 'Sign In' : 'Sign Up'}</button>
        </p>
      </div>
    </div>
  )
}

export default App
