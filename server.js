import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const shopHtml = readFileSync("public/bunnings-shop-widget.html", "utf8");

// Bunnings Product Catalog - Realistic hardware products with details
const BUNNINGS_PRODUCTS = [
  {
    id: "prod-001",
    name: "Ozito 18V Cordless Drill Driver Kit",
    category: "Power Tools",
    price: 89.00,
    description: "18V cordless drill with 2 batteries, charger and carry case. Perfect for DIY projects.",
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=600&fit=crop&q=80",
    inStock: true,
    rating: 4.5
  },
  {
    id: "prod-002",
    name: "Makita 18V Hammer Drill Kit",
    category: "Power Tools",
    price: 249.00,
    description: "Professional-grade hammer drill with brushless motor. Includes 2x 5.0Ah batteries.",
    image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&h=600&fit=crop&q=80",
    inStock: true,
    rating: 4.8
  },
  {
    id: "prod-003",
    name: "Stanley FatMax Claw Hammer 570g",
    category: "Hand Tools",
    price: 34.90,
    description: "Anti-vibration fiberglass handle with comfortable grip. Built for heavy-duty use.",
    image: "https://images.unsplash.com/photo-1580656449943-2a659fc2fab8?w=600&h=600&fit=crop&q=80",
    inStock: true,
    rating: 4.6
  },
  {
    id: "prod-004",
    name: "Craftright 16oz Claw Hammer",
    category: "Hand Tools",
    price: 12.50,
    description: "Affordable all-purpose hammer with steel handle. Great for general household repairs.",
    image: "https://images.unsplash.com/photo-1580656449943-2a659fc2fab8?w=600&h=600&fit=crop&q=80",
    inStock: true,
    rating: 4.2
  },
  {
    id: "prod-005",
    name: "Ryobi ONE+ 18V Impact Drill",
    category: "Power Tools",
    price: 159.00,
    description: "Compact impact drill for fastening and drilling. Compatible with all ONE+ batteries.",
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=600&fit=crop&q=80",
    inStock: true,
    rating: 4.4
  },
  {
    id: "prod-006",
    name: "DeWalt 20V MAX Cordless Drill Combo",
    category: "Power Tools",
    price: 329.00,
    description: "Premium cordless drill and impact driver combo kit. Industry-leading performance.",
    image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&h=600&fit=crop&q=80",
    inStock: true,
    rating: 4.9
  },
  {
    id: "prod-007",
    name: "Tactix Ball Pein Hammer 450g",
    category: "Hand Tools",
    price: 18.90,
    description: "Ball pein hammer ideal for metalworking and shaping. Durable fiberglass handle.",
    image: "https://images.unsplash.com/photo-1580656449943-2a659fc2fab8?w=600&h=600&fit=crop&q=80",
    inStock: true,
    rating: 4.3
  },
  {
    id: "prod-008",
    name: "Black+Decker 12V Drill Driver",
    category: "Power Tools",
    price: 69.00,
    description: "Compact and lightweight drill perfect for everyday tasks. Includes battery and charger.",
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=600&fit=crop&q=80",
    inStock: true,
    rating: 4.1
  }
];

// Schema for search_products tool - defines what parameters the AI can use
const searchProductsSchema = {
  query: z.string().min(1).describe("Product search query (e.g., 'drill', 'hammer', 'power tools')"),
  category: z.string().optional().describe("Filter by category (e.g., 'Power Tools', 'Hand Tools')")
};

// Helper function to search products based on query and category
function searchProducts(query, category) {
  const lowerQuery = query.toLowerCase();
  
  return BUNNINGS_PRODUCTS.filter(product => {
    // Check if query matches name, description, or category
    const matchesQuery = 
      product.name.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery);
    
    // Check category filter if provided
    const matchesCategory = !category || product.category === category;
    
    return matchesQuery && matchesCategory;
  });
}

// Helper function to format products for display in the widget
const replyWithProducts = (message, products) => ({
  content: message ? [{ type: "text", text: message }] : [],
  structuredContent: { 
    products: products || []
  },
});

function createBunningsServer() {
  const server = new McpServer({ name: "bunnings-commerce", version: "1.0.0" });

  // Register the shopping widget UI
  server.registerResource(
    "bunnings-shop-widget",
    "ui://widget/shop.html",
    {},
    async () => ({
      contents: [
        {
          uri: "ui://widget/shop.html",
          mimeType: "text/html+skybridge",
          text: shopHtml,
          _meta: { "openai/widgetPrefersBorder": false },
        },
      ],
    })
  );

  // Tool 1: search_products - AI uses this to find products based on user request
  server.registerTool(
    "search_products",
    {
      title: "Search Products",
      description: "Search for Bunnings products. Use this when customer asks to find items like 'drill', 'hammer', or any hardware product.",
      inputSchema: searchProductsSchema,
      _meta: {
        "openai/outputTemplate": "ui://widget/shop.html",
        "openai/toolInvocation/invoking": "Searching Bunnings catalog...",
        "openai/toolInvocation/invoked": "Found products",
      },
    },
    async (args) => {
      const query = args?.query?.trim?.() ?? "";
      const category = args?.category?.trim?.() ?? null;
      
      if (!query) {
        return replyWithProducts("Please tell me what you're looking for!", []);
      }
      
      // Perform the search
      const results = searchProducts(query, category);
      
      if (results.length === 0) {
        return replyWithProducts(
          `Sorry, I couldn't find any products matching "${query}". Try searching for drills, hammers, or other tools!`,
          []
        );
      }
      
      // Return results with a helpful message
      const message = `Found ${results.length} ${results.length === 1 ? 'product' : 'products'} matching "${query}". ${results.length > 3 ? 'Showing top results.' : ''}`;
      return replyWithProducts(message, results);
    }
  );

  return server;
}

const port = Number(process.env.PORT ?? 8787);
const MCP_PATH = "/mcp";

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/plain" }).end("Bunnings Agentic Commerce MCP Server");
    return;
  }

  const MCP_METHODS = new Set(["POST", "GET", "DELETE"]);
  if (url.pathname === MCP_PATH && req.method && MCP_METHODS.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createBunningsServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless mode
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, () => {
  console.log(
    `🔨 Bunnings Agentic Commerce MCP Server\n🌐 Listening on http://localhost:${port}${MCP_PATH}\n🛒 Ready to serve customers!`
  );
});