import { createClient } from "@/lib/supabase/server"

export interface CodeExample {
  id: string
  title: string
  description: string | null
  code: string
  language: string
  created_at: string
  updated_at: string
}

export interface EngineExecution {
  id: string
  status: 'idle' | 'analyzing' | 'running' | 'paused' | 'error'
  code: string
  output: string | null
  error: string | null
  metrics: any
  started_at: string
  completed_at: string | null
  duration_ms: number | null
}

export interface EvolutionHistory {
  id: string
  version: string
  title: string
  description: string
  impact: 'critical' | 'high' | 'medium' | 'low'
  examples: any
  created_at: string
}

export interface LanguageProposal {
  id: string
  title: string
  description: string
  rationale: string | null
  examples: any
  status: 'pending' | 'approved' | 'rejected' | 'implemented'
  created_at: string
  updated_at: string
}

export async function getCodeExamples() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('code_examples')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as CodeExample[]
}

export async function saveExecution(execution: Omit<EngineExecution, 'id' | 'started_at'>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('engine_executions')
    .insert(execution)
    .select()
    .single()
  
  if (error) throw error
  return data as EngineExecution
}

export async function getEvolutionHistory() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('evolution_history')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as EvolutionHistory[]
}

export async function saveProposal(proposal: Omit<LanguageProposal, 'id' | 'created_at' | 'updated_at' | 'status'>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('language_proposals')
    .insert(proposal)
    .select()
    .single()
  
  if (error) throw error
  return data as LanguageProposal
}
