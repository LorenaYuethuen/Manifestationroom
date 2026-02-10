import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
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

// Health check endpoint
app.get("/make-server-dcd239fe/health", (c) => {
  return c.json({ status: "ok" });
});

// Notion Sync Endpoint
app.post("/make-server-dcd239fe/sync-notion", async (c) => {
  try {
    const notionKey = c.req.header("x-notion-key");
    const pageId = c.req.header("x-notion-page-id");
    
    if (!notionKey || !pageId) {
      return c.json({ error: "Missing Notion credentials" }, 400);
    }

    const { analysis } = await c.req.json();
    
    // Construct Notion Blocks from Analysis
    const children = [
      {
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: [{ type: "text", text: { content: `✨ Vision Analysis: ${analysis.visualDNA.archetype}` } }]
        }
      },
      {
        object: "block",
        type: "callout",
        callout: {
          icon: { emoji: "🔮" },
          rich_text: [{ type: "text", text: { content: `Emotional Core: ${analysis.visualDNA.emotionalCore.join(", ")}` } }]
        }
      },
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "Action Plan (SOP Mapped)" } }]
        }
      }
    ];

    // Add SOP Items
    analysis.sopMapping.forEach((item: any) => {
       children.push({
         object: "block",
         type: "heading_3",
         heading_3: {
           rich_text: [{ type: "text", text: { content: `${item.module} - ${item.subSystem}` } }]
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

    // Call Notion API to append blocks to the page
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
    
    if (!response.ok) {
      console.error("Notion API Error:", data);
      return c.json({ error: data.message || "Failed to sync to Notion" }, 500);
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.error("Server Error:", error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);