import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import Anthropic from "npm:@anthropic-ai/sdk@0.39.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface ChatRequest {
  message: string
}

interface RegistryItem {
  id: string
  type: string
  name: string
  path: string
  description: string | null
  project: string
  tags: string[]
  metadata: Record<string, unknown>
}

// Tool definitions for Claude
const tools: Anthropic.Tool[] = [
  {
    name: "list_items",
    description: "List registry items with optional filtering by type, name pattern, or tags",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: ["api", "prompt", "skill", "agent", "command", "instruction"],
          description: "Filter by item type"
        },
        name_pattern: {
          type: "string",
          description: "Filter by name (case-insensitive contains)"
        },
        tag: {
          type: "string",
          description: "Filter by tag"
        },
        limit: {
          type: "number",
          description: "Maximum number of items to return (default 20)"
        }
      },
      required: []
    }
  },
  {
    name: "get_item",
    description: "Get details of a specific registry item by ID or name",
    input_schema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "The ID of the item"
        },
        name: {
          type: "string",
          description: "The name of the item (if ID not provided)"
        }
      },
      required: []
    }
  },
  {
    name: "create_item",
    description: "Create a new registry item",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: ["api", "prompt", "skill", "agent", "command", "instruction"],
          description: "The type of item"
        },
        name: {
          type: "string",
          description: "Name of the item"
        },
        description: {
          type: "string",
          description: "Description of the item"
        },
        path: {
          type: "string",
          description: "File path for the item"
        },
        project: {
          type: "string",
          description: "Project name (default: global)"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for the item"
        }
      },
      required: ["type", "name"]
    }
  },
  {
    name: "update_item",
    description: "Update an existing registry item",
    input_schema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "The ID of the item to update"
        },
        name: {
          type: "string",
          description: "New name"
        },
        description: {
          type: "string",
          description: "New description"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "New tags"
        }
      },
      required: ["id"]
    }
  },
  {
    name: "delete_item",
    description: "Delete a registry item by ID",
    input_schema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "The ID of the item to delete"
        }
      },
      required: ["id"]
    }
  },
  {
    name: "get_stats",
    description: "Get statistics about the registry",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: []
    }
  }
]

const systemPrompt = `Je bent een assistent voor het Command Center. Je beheert registry items (APIs, Prompts, Skills, Agents, Commands, Instructions).

Je kunt:
- Items opvragen en tonen (list_items, get_item, get_stats)
- Nieuwe items toevoegen (create_item)
- Items wijzigen (update_item)
- Items verwijderen (delete_item)

Antwoord altijd in het Nederlands. Wees beknopt en helder.
Gebruik de beschikbare tools om informatie op te halen voordat je antwoord geeft.
Als je meerdere items moet tonen, formatteer ze overzichtelijk met bullets of een korte lijst.
Bij een zoekopdracht, gebruik eerst list_items om te zoeken.`

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured")
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { message } = await req.json() as ChatRequest

    if (!message) {
      throw new Error("Message is required")
    }

    const anthropic = new Anthropic({ apiKey: anthropicApiKey })

    // Initial message to Claude
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: message }
    ]

    // Tool execution function
    async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
      switch (name) {
        case "list_items": {
          let query = supabase.from("registry_items").select("*")
          
          if (input.type) {
            query = query.eq("type", input.type)
          }
          if (input.name_pattern) {
            query = query.ilike("name", `%${input.name_pattern}%`)
          }
          if (input.tag) {
            query = query.contains("tags", [input.tag])
          }
          
          const limit = (input.limit as number) || 20
          query = query.limit(limit).order("created_at", { ascending: false })
          
          const { data, error } = await query
          if (error) throw error
          
          return JSON.stringify(data || [])
        }

        case "get_item": {
          let query = supabase.from("registry_items").select("*")
          
          if (input.id) {
            query = query.eq("id", input.id)
          } else if (input.name) {
            query = query.ilike("name", input.name as string)
          }
          
          const { data, error } = await query.single()
          if (error) throw error
          
          return JSON.stringify(data)
        }

        case "create_item": {
          const newItem = {
            type: input.type,
            name: input.name,
            description: input.description || null,
            path: input.path || `~/.claude/${input.type}s/${input.name}`,
            project: input.project || "global",
            tags: input.tags || [],
            metadata: {},
            synced_at: new Date().toISOString()
          }
          
          const { data, error } = await supabase
            .from("registry_items")
            .insert(newItem)
            .select()
            .single()
          
          if (error) throw error
          
          // Log activity
          await supabase.from("activity_log").insert({
            action: "created",
            item_type: input.type,
            item_id: data.id,
            item_name: input.name as string,
            details: { source: "chat-agent" }
          })
          
          return JSON.stringify({ success: true, item: data })
        }

        case "update_item": {
          const updates: Record<string, unknown> = {}
          if (input.name) updates.name = input.name
          if (input.description !== undefined) updates.description = input.description
          if (input.tags) updates.tags = input.tags
          updates.updated_at = new Date().toISOString()
          
          const { data, error } = await supabase
            .from("registry_items")
            .update(updates)
            .eq("id", input.id)
            .select()
            .single()
          
          if (error) throw error
          
          // Log activity
          await supabase.from("activity_log").insert({
            action: "updated",
            item_type: data.type,
            item_id: data.id,
            item_name: data.name,
            details: { source: "chat-agent", changes: Object.keys(updates) }
          })
          
          return JSON.stringify({ success: true, item: data })
        }

        case "delete_item": {
          // First get the item details for logging
          const { data: item } = await supabase
            .from("registry_items")
            .select("*")
            .eq("id", input.id)
            .single()
          
          const { error } = await supabase
            .from("registry_items")
            .delete()
            .eq("id", input.id)
          
          if (error) throw error
          
          // Log activity
          if (item) {
            await supabase.from("activity_log").insert({
              action: "deleted",
              item_type: item.type,
              item_id: item.id,
              item_name: item.name,
              details: { source: "chat-agent" }
            })
          }
          
          return JSON.stringify({ success: true, deleted_id: input.id })
        }

        case "get_stats": {
          const { data, error } = await supabase
            .from("registry_items")
            .select("type")
          
          if (error) throw error
          
          const stats: Record<string, number> = {
            api: 0,
            prompt: 0,
            skill: 0,
            agent: 0,
            command: 0,
            instruction: 0
          }
          
          for (const item of data || []) {
            if (item.type in stats) {
              stats[item.type]++
            }
          }
          
          return JSON.stringify({
            total: data?.length || 0,
            byType: stats
          })
        }

        default:
          throw new Error(`Unknown tool: ${name}`)
      }
    }

    // Agentic loop - keep processing until we get a final response
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages
    })

    while (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      )

      const toolResults: Anthropic.ToolResultBlockParam[] = []
      
      for (const toolUse of toolUseBlocks) {
        try {
          const result = await executeTool(toolUse.name, toolUse.input as Record<string, unknown>)
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: result
          })
        } catch (error) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            is_error: true
          })
        }
      }

      // Add assistant message and tool results to conversation
      messages.push({ role: "assistant", content: response.content })
      messages.push({ role: "user", content: toolResults })

      // Get next response
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        tools,
        messages
      })
    }

    // Extract text response
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    )

    return new Response(
      JSON.stringify({ response: textBlock?.text || "Geen antwoord." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        response: `Er ging iets mis: ${error instanceof Error ? error.message : "Onbekende fout"}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
