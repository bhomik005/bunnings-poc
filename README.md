# 🔨 Bunnings Agentic Commerce

An AI-powered shopping assistant for Bunnings Warehouse built using the Model Context Protocol (MCP).

## 🚀 How to Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   node server.js
   ```

3. **Expose your local server** (required for ChatGPT):
   ```bash
   # Using ngrok
   ngrok http 8787
   
   # Or use any other tunneling service (cloudflare tunnel, localtunnel, etc.)
   ```

## 🤖 Add Your App to ChatGPT

Once your server is running and exposed via HTTPS tunnel:

1. **Enable developer mode** under Settings → Apps & Connectors → Advanced settings in ChatGPT.

2. **Click the Create button** to add a connector under Settings → Connectors and paste the HTTPS + `/mcp` URL from your tunnel (e.g. `https://<subdomain>.ngrok.app/mcp`).

3. **Name the connector**, provide a short description and click Create.

4. **Open a new chat**, add your connector from the More menu (accessible after clicking the + button), and prompt the model (e.g., "Find me a drill"). ChatGPT will stream tool payloads so you can confirm inputs and outputs.

## 💡 Usage Examples

Ask the AI assistant:
- "Show me all drills"
- "Find me a hammer"
---

**Note:** This is a demo prototype for Bunnings agentic commerce.
