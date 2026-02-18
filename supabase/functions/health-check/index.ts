import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase.from('sync_status').update({
      status: 'running',
      last_run_at: new Date().toISOString(),
    }).eq('id', 'health_check')

    const startTime = Date.now()
    const newAlerts: Array<{
      type: string
      severity: string
      title: string
      description: string
      entity_type: string
      entity_id: string
      metadata: Record<string, unknown>
    }> = []

    // Check 1: Unhealthy projects
    const { data: metrics } = await supabase
      .from('project_metrics')
      .select('project_slug, health, error_count, warning_count')

    for (const m of metrics || []) {
      if (m.health === 'unhealthy' || (m.error_count && m.error_count > 10)) {
        newAlerts.push({
          type: 'unhealthy_project',
          severity: 'critical',
          title: `Project "${m.project_slug}" is unhealthy`,
          description: `${m.error_count || 0} errors, ${m.warning_count || 0} warnings gevonden. Draai een code analyse om details te zien.`,
          entity_type: 'project',
          entity_id: m.project_slug,
          metadata: { health: m.health, errors: m.error_count, warnings: m.warning_count },
        })
      } else if (m.health === 'needs-attention') {
        newAlerts.push({
          type: 'unhealthy_project',
          severity: 'warning',
          title: `Project "${m.project_slug}" heeft aandacht nodig`,
          description: `${m.warning_count || 0} warnings gevonden. Bekijk de Health tab voor details.`,
          entity_type: 'project',
          entity_id: m.project_slug,
          metadata: { health: m.health, warnings: m.warning_count },
        })
      }
    }

    // Check 2: Stale assets
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: staleCount } = await supabase
      .from('registry_items')
      .select('*', { count: 'exact', head: true })
      .lt('updated_at', thirtyDaysAgo)

    if (staleCount && staleCount > 10) {
      newAlerts.push({
        type: 'stale_asset',
        severity: 'warning',
        title: `${staleCount} assets niet bijgewerkt in 30+ dagen`,
        description: 'Overweeg een registry sync of verwijder ongebruikte assets.',
        entity_type: 'asset',
        entity_id: 'bulk',
        metadata: { stale_count: staleCount },
      })
    }

    // Check 3: Orphan assets
    const { count: orphanCount } = await supabase
      .from('registry_items')
      .select('*', { count: 'exact', head: true })
      .or('project.is.null,project.eq.global')

    if (orphanCount && orphanCount > 20) {
      newAlerts.push({
        type: 'orphan_detected',
        severity: 'info',
        title: `${orphanCount} assets zonder project koppeling`,
        description: 'Deze assets zijn "global" of hebben geen project. Overweeg ze aan een project te koppelen.',
        entity_type: 'asset',
        entity_id: 'bulk',
        metadata: { orphan_count: orphanCount },
      })
    }

    // Check 4: Failed sync jobs
    const { data: failedJobs } = await supabase
      .from('job_queue')
      .select('id, type, error, created_at')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (failedJobs && failedJobs.length > 0) {
      const job = failedJobs[0]
      newAlerts.push({
        type: 'sync_failed',
        severity: 'critical',
        title: `Laatste ${job.type} is mislukt`,
        description: job.error || 'Onbekende fout. Probeer handmatig opnieuw.',
        entity_type: 'job',
        entity_id: job.id,
        metadata: { job_type: job.type, job_id: job.id },
      })
    }

    // Deduplicate
    const { data: existingAlerts } = await supabase
      .from('alerts')
      .select('type, entity_id')
      .in('status', ['new', 'acknowledged'])

    const existingKeys = new Set(
      (existingAlerts || []).map((a: { type: string; entity_id: string }) => `${a.type}:${a.entity_id}`)
    )

    const deduped = newAlerts.filter(
      a => !existingKeys.has(`${a.type}:${a.entity_id}`)
    )

    // Auto-resolve
    const activeAlertTypes = new Set(newAlerts.map(a => `${a.type}:${a.entity_id}`))
    const { data: toResolve } = await supabase
      .from('alerts')
      .select('id, type, entity_id')
      .in('status', ['new', 'acknowledged'])
      .in('type', ['unhealthy_project', 'stale_asset', 'orphan_detected', 'sync_failed'])

    const resolveIds = (toResolve || [])
      .filter((a: { type: string; entity_id: string }) => !activeAlertTypes.has(`${a.type}:${a.entity_id}`))
      .map((a: { id: string }) => a.id)

    if (resolveIds.length > 0) {
      await supabase.from('alerts').update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      }).in('id', resolveIds)
    }

    if (deduped.length > 0) {
      await supabase.from('alerts').insert(deduped)
    }

    const duration = Date.now() - startTime

    await supabase.from('sync_status').update({
      status: 'success',
      duration_ms: duration,
      items_processed: deduped.length,
    }).eq('id', 'health_check')

    return new Response(
      JSON.stringify({
        success: true,
        new_alerts: deduped.length,
        auto_resolved: resolveIds.length,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
