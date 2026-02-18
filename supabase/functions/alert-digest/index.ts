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

    const { data: openAlerts } = await supabase
      .from('alerts')
      .select('severity, status')
      .in('status', ['new', 'acknowledged'])

    const alerts = openAlerts || []
    const critical = alerts.filter((a: { severity: string }) => a.severity === 'critical').length
    const warning = alerts.filter((a: { severity: string }) => a.severity === 'warning').length
    const info = alerts.filter((a: { severity: string }) => a.severity === 'info').length

    // Auto-resolve info alerts older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: oldInfoAlerts } = await supabase
      .from('alerts')
      .select('id')
      .eq('severity', 'info')
      .in('status', ['new', 'acknowledged'])
      .lt('created_at', sevenDaysAgo)

    if (oldInfoAlerts && oldInfoAlerts.length > 0) {
      await supabase.from('alerts').update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      }).in('id', oldInfoAlerts.map((a: { id: string }) => a.id))
    }

    // Create daily digest
    if (alerts.length > 0) {
      await supabase.from('alerts')
        .delete()
        .eq('type', 'daily_digest')
        .in('status', ['new'])

      const parts = []
      if (critical > 0) parts.push(`${critical} kritiek`)
      if (warning > 0) parts.push(`${warning} waarschuwing${warning > 1 ? 'en' : ''}`)
      if (info > 0) parts.push(`${info} info`)

      await supabase.from('alerts').insert({
        type: 'daily_digest',
        severity: critical > 0 ? 'critical' : warning > 0 ? 'warning' : 'info',
        title: `Dagelijks overzicht: ${parts.join(', ')}`,
        description: `Er ${alerts.length === 1 ? 'is' : 'zijn'} ${alerts.length} openstaande alert${alerts.length > 1 ? 's' : ''}. Bekijk de alerts pagina voor details.`,
        entity_type: 'system',
        entity_id: 'digest',
        metadata: { critical, warning, info, total: alerts.length },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        open_alerts: alerts.length,
        auto_resolved: oldInfoAlerts?.length || 0,
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
