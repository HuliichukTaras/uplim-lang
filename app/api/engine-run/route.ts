// API Route - Run UPLim Engine Analysis

import { initEngine, analyzeProject } from '@/engine/interface/engine_main'
import { ProjectHandle } from '@/compiler/project_handle'

export async function POST(request: Request) {
  try {
    const { projectName, files, enableAI, aiApiKey } = await request.json()

    console.log('[API] Starting engine analysis for project:', projectName)

    // Initialize engine
    const engine = initEngine({
      enableAI: enableAI || false,
      aiProvider: 'openai',
      aiApiKey: aiApiKey || process.env.OPENAI_API_KEY,
      performanceProfilePath: '/tmp/uplim-profiles'
    })

    // Create project handle
    const project = new ProjectHandle(projectName, '/tmp/project', files || [])

    // Run analysis
    const report = await analyzeProject(engine, project)

    return Response.json({
      success: true,
      report
    })
  } catch (error: any) {
    console.error('[API] Engine error:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
