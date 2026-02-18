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

    const appUrl = Deno.env.get('APP_URL') ?? 'https://command-center-app-nine.vercel.app'
    const syncApiKey = Deno.env.get('SYNC_API_KEY') ?? ''

    const { data: job } = await supabase
      .from('job_queue')
      .insert({ type: 'registry_sync', status: 'running', started_at: new Date().toISOString() })
      .select()
      .single()

    await supabase.from('sync_status').update({
      status: 'running',
      last_run_at: new Date().toISOString(),
    }).eq('id', 'registry_sync')

    const startTime = Date.now()

    const statusRes = await fetch(`${appUrl}/api/sync`, {
      method: 'GET',
      headers: { 'x-api-key': syncApiKey },
    })

    const statusData = await statusRes.json()
    const duration = Date.now() - startTime

    if (job) {
      await supabase.from('job_queue').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: statusData,
      }).eq('id', job.id)
    }

    const totalItems = Object.values(statusData.stats || {}).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0)

    await supabase.from('sync_status').update({
      status: 'success',
      duration_ms: duration,
      items_processed: totalItems as number,
      next_run_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    }).eq('id', 'registry_sync')

    // Trigger health check
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const healthRes = await fetch(
      `${supabaseUrl}/functions/v1/health-check`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      }
    )

    const healthData = await healthRes.json()

    return new Response(
      JSON.stringify({
        success: true,
        sync: statusData,
        health: healthData,
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
