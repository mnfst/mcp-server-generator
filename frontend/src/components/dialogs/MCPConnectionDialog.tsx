import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check } from 'lucide-react';
import { MCPServer } from 'shared';
import { API_BASE_URL } from '@/lib/api';

interface MCPConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mcpServer: MCPServer;
}

/**
 * MCPConnectionDialog displays connection instructions for integrating
 * an MCP server with various clients.
 *
 * Features:
 * - Tabbed interface for different client types
 * - Copy-to-clipboard functionality
 * - Claude Desktop configuration instructions
 * - Placeholder tabs for future integrations
 */
export function MCPConnectionDialog({
  open,
  onOpenChange,
  mcpServer,
}: MCPConnectionDialogProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const handleCopy = (text: string, tabId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabId);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  // Generate Claude Desktop config
  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        [mcpServer.slug]: {
          url: `${API_BASE_URL}${mcpServer.mcpEndpoint}`,
          name: mcpServer.name,
        },
      },
    },
    null,
    2
  );

  // Placeholder configs for other platforms
  const vscodeConfig = JSON.stringify(
    {
      "mcp.servers": [
        {
          "name": mcpServer.name,
          "url": `${API_BASE_URL}${mcpServer.mcpEndpoint}`,
        },
      ],
    },
    null,
    2
  );

  const curlExample = `curl -X POST ${API_BASE_URL}${mcpServer.mcpEndpoint} \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Connect to {mcpServer.name}</DialogTitle>
          <DialogDescription>
            Follow the instructions below to connect this MCP server to your client.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="claude-desktop" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="claude-desktop">Claude Desktop</TabsTrigger>
            <TabsTrigger value="vscode">VS Code (Coming Soon)</TabsTrigger>
            <TabsTrigger value="api">API / cURL</TabsTrigger>
          </TabsList>

          {/* Claude Desktop Tab */}
          <TabsContent value="claude-desktop" className="flex-1 overflow-y-auto space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Step 1: Locate your Claude Desktop config</h3>
              <p className="text-sm text-muted-foreground">
                Open your Claude Desktop configuration file:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>macOS:</strong>{' '}
                  <code className="bg-slate-100 px-1 rounded">
                    ~/Library/Application Support/Claude/claude_desktop_config.json
                  </code>
                </li>
                <li>
                  <strong>Windows:</strong>{' '}
                  <code className="bg-slate-100 px-1 rounded">
                    %APPDATA%\Claude\claude_desktop_config.json
                  </code>
                </li>
                <li>
                  <strong>Linux:</strong>{' '}
                  <code className="bg-slate-100 px-1 rounded">
                    ~/.config/Claude/claude_desktop_config.json
                  </code>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Step 2: Add this configuration</h3>
              <p className="text-sm text-muted-foreground">
                Copy and merge this JSON configuration into your config file:
              </p>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{claudeDesktopConfig}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-slate-50"
                  onClick={() => handleCopy(claudeDesktopConfig, 'claude-desktop')}
                >
                  {copiedTab === 'claude-desktop' ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Step 3: Restart Claude Desktop</h3>
              <p className="text-sm text-muted-foreground">
                Close and reopen Claude Desktop for the changes to take effect.
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Make sure the MCP server is activated (status: active)
                before trying to connect from Claude Desktop.
              </p>
            </div>
          </TabsContent>

          {/* VS Code Tab (Placeholder) */}
          <TabsContent value="vscode" className="flex-1 overflow-y-auto space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">VS Code Integration (Coming Soon)</h3>
              <p className="text-sm text-muted-foreground">
                Support for VS Code is currently in development. Here's a preview of the
                configuration:
              </p>
              <div className="relative">
                <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{vscodeConfig}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-slate-50"
                  onClick={() => handleCopy(vscodeConfig, 'vscode')}
                >
                  {copiedTab === 'vscode' ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-900">
                This feature is not yet available. Stay tuned for updates!
              </p>
            </div>
          </TabsContent>

          {/* API / cURL Tab */}
          <TabsContent value="api" className="flex-1 overflow-y-auto space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Direct API Access</h3>
              <p className="text-sm text-muted-foreground">
                You can interact with this MCP server directly via HTTP requests:
              </p>

              <div className="space-y-2">
                <p className="text-sm font-medium">Endpoint:</p>
                <code className="block bg-slate-100 px-3 py-2 rounded text-sm">
                  {API_BASE_URL}
                  {mcpServer.mcpEndpoint}
                </code>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Example cURL request:</p>
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{curlExample}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-slate-50"
                    onClick={() => handleCopy(curlExample, 'api')}
                  >
                    {copiedTab === 'api' ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-sm text-slate-900">
                <strong>Protocol:</strong> This endpoint follows the Model Context Protocol
                (MCP) specification. Send JSON-RPC 2.0 formatted requests.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
