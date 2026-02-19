import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase not configured");
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface DiscoveredProject {
  name: string;
  has_git: boolean;
  has_package: boolean;
  has_claude: boolean;
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (
    !apiKey ||
    !process.env.SYNC_API_KEY ||
    apiKey !== process.env.SYNC_API_KEY
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { projects } = body as { projects: DiscoveredProject[] };
  if (!projects || !Array.isArray(projects)) {
    return NextResponse.json({ error: "projects[] required" }, { status: 400 });
  }

  const supabase = getSupabase();
  let discovered = 0;

  for (const project of projects) {
    const slug = project.name.toLowerCase().replace(/\s+/g, "-");

    // Check projects table
    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .limit(1)
      .single();

    if (!existing) {
      // Insert into projects table
      await supabase.from("projects").insert({
        name: project.name,
        slug,
        workspace_id: "a0000000-0000-0000-0000-000000000001",
        client_id: "10000000-0000-0000-0000-000000000002",
        start_date: new Date().toISOString().slice(0, 10),
        end_date: "2026-12-31",
      });

      // Insert into projecten table
      await supabase.from("projecten").insert({
        id: slug,
        naam: project.name,
        name: project.name,
        slug,
        locatie: `~/projects/${project.name}`,
        project_path: `~/projects/${project.name}`,
        status: "Actief",
        start_datum: new Date().toISOString().slice(0, 10),
        voortgang: 0,
      });

      // Log discovery
      await supabase.from("activity_log").insert({
        item_type: "project",
        item_name: project.name,
        action: "discovered",
        details: {
          has_git: project.has_git,
          has_package: project.has_package,
          has_claude: project.has_claude,
        },
      });

      discovered++;
    }
  }

  return NextResponse.json({
    success: true,
    total: projects.length,
    discovered,
    message:
      discovered > 0
        ? `${discovered} new project(s) discovered`
        : "All projects already known",
  });
}
