import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase Client for Storage & Auth
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Constants
const BUCKET_NAME = "make-dcd239fe-visions";

// Middleware
app.use('*', logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "x-notion-key", "x-notion-page-id"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper: Ensure bucket exists
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
  if (!bucketExists) {
    await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 10485760, // 10MB
    });
  }
}

// Routes

// 1. Health
app.get("/make-server-dcd239fe/health", (c) => c.json({ status: "ok" }));

// 2. Upload Image (Storage)
app.post("/make-server-dcd239fe/upload", async (c) => {
  try {
    await ensureBucket();
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) throw error;

    // Create signed URL (valid for 1 year for simplicity in this demo context, or handle refresh)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 31536000);

    if (signedError) throw signedError;

    return c.json({ url: signedData.signedUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return c.json({ error: err.message }, 500);
  }
});

// 3. Save Vision Analysis (KV Store)
app.post("/make-server-dcd239fe/visions", async (c) => {
  try {
    const { vision } = await c.req.json();
    if (!vision || !vision.id) {
      return c.json({ error: "Invalid vision data" }, 400);
    }
    
    // Store in KV
    // Key format: vision-{timestamp}-{random}
    await kv.set(vision.id, vision);
    
    return c.json({ success: true });
  } catch (err) {
    console.error("Save error:", err);
    return c.json({ error: err.message }, 500);
  }
});

// 4. List Visions (KV Store)
app.get("/make-server-dcd239fe/visions", async (c) => {
  try {
    // Get all keys starting with 'vision-'
    // Since kv.getByPrefix returns values directly
    const visions = await kv.getByPrefix("vision-");
    
    // Sort by timestamp descending
    const sorted = visions.sort((a: any, b: any) => b.uploadedAt - a.uploadedAt);
    
    return c.json({ data: sorted });
  } catch (err) {
    console.error("List error:", err);
    return c.json({ error: err.message }, 500);
  }
});

// 5. Delete Vision
app.delete("/make-server-dcd239fe/visions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(id);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 6. Notion Sync (Existing)
app.post("/make-server-dcd239fe/sync-notion", async (c) => {
  try {
    const notionKey = c.req.header("x-notion-key");
    const pageId = c.req.header("x-notion-page-id");
    
    if (!notionKey || !pageId) {
      return c.json({ error: "Missing Notion credentials" }, 400);
    }

    const { analysis } = await c.req.json();
    
    // Helper to create children blocks
    const children = [];

    // Vision Header
    children.push({
      object: "block",
      type: "heading_1",
      heading_1: {
        rich_text: [{ type: "text", text: { content: `🎨 Vision: ${analysis.visualDNA.archetype}` } }]
      }
    });

    // Image (if available)
    if (analysis.imageUrl) {
      children.push({
        object: "block",
        type: "image",
        image: {
          type: "external",
          external: { url: analysis.imageUrl }
        }
      });
    }

    // DNA Callout
    children.push({
      object: "block",
      type: "callout",
      callout: {
        icon: { emoji: "🔮" },
        rich_text: [
          { type: "text", text: { content: `Values: ${analysis.lifestyleInference.values.join(" • ")}\n` } },
          { type: "text", text: { content: `Materials: ${analysis.visualDNA.materials.join(", ")}` } }
        ]
      }
    });

    // SOP Section
    children.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: "⚡ SOP Execution" } }]
      }
    });

    const sopGroups: Record<string, any[]> = { "WRITE_PLAN": [], "PLAN": [], "DO": [], "CHECK": [] };
    analysis.sopMapping.forEach((item: any) => {
      if (sopGroups[item.module]) sopGroups[item.module].push(item);
    });

    for (const [module, items] of Object.entries(sopGroups)) {
       children.push({
         object: "block",
         type: "heading_3",
         heading_3: {
           rich_text: [{ type: "text", text: { content: module } }],
           color: "blue_background"
         }
       });

       items.forEach((item: any) => {
          children.push({
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                { type: "text", text: { content: `📍 ${item.subSystem}`, annotations: { bold: true } } },
                { type: "text", text: { content: ` (Cue: ${item.visualCue})`, annotations: { italic: true, color: "gray" } } }
              ]
            }
          });
          item.actions.forEach((action: string) => {
            children.push({
              object: "block",
              type: "to_do",
              to_do: {
                rich_text: [{ type: "text", text: { content: action } }],
                checked: false
              }
            });
          });
       });
    }

    // Routine Section
    children.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: "📅 Generated Daily Routine" } }]
      }
    });

    const routines = analysis.lifestyleInference.dailyRituals || [];
    if (routines.length > 0) {
        routines.forEach((r: string) => 
            children.push({ object: "block", type: "to_do", to_do: { rich_text: [{ type: "text", text: { content: r } }], checked: false } })
        );
    }

    // Call Notion API
    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${notionKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({ children })
    });

    const data = await response.json();
    if (!response.ok) return c.json({ error: data.message || "Failed to sync" }, 500);

    return c.json({ success: true, data });
  } catch (error) {
    console.error("Server Error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// 7. AI Analysis Proxy (Fixes CORS and Region issues)
app.post("/make-server-dcd239fe/analyze-proxy", async (c) => {
  try {
    const { provider, apiKey, payload, model } = await c.req.json();
    
    if (!provider || !apiKey || !payload) {
      return c.json({ error: "Missing required parameters" }, 400);
    }

    let url = "";
    let options: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    };

    if (provider === "claude") {
      url = "https://api.anthropic.com/v1/messages";
      options.headers = {
        ...options.headers,
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      };
      options.body = JSON.stringify(payload);
    } else if (provider === "gemini") {
      // Allow model override, default to flash
      const targetModel = model || "gemini-1.5-flash";
      url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
      options.body = JSON.stringify(payload);
    } else {
      return c.json({ error: "Invalid provider" }, 400);
    }

    console.log(`Proxying to ${provider} (${url})...`);
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      // Suppress logging for known user-error types (billing, auth) to keep logs clean
      const errType = data.error?.type;
      const errMsg = data.error?.message || '';
      
      if (errType === 'authentication_error' || errMsg.includes('credit balance') || errMsg.includes('too low')) {
          console.warn(`${provider} API Auth/Billing Issue: ${errMsg}`);
      } else {
          console.error(`${provider} API Error:`, data);
      }
      return c.json(data, response.status);
    }

    return c.json(data);

  } catch (error) {
    console.error("Proxy Error:", error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);