import { useState } from 'react';
import { FlowCanvas } from './components/canvas/FlowCanvas';
import { CreateDatasourceDialog } from './components/dialogs/CreateDatasourceDialog';
import { CreateMCPServerDialog } from './components/dialogs/CreateMCPServerDialog';
import { Button } from './components/ui/button';
import { Database, Server } from 'lucide-react';

function App() {
  const [datasourceDialogOpen, setDatasourceDialogOpen] = useState(false);
  const [mcpServerDialogOpen, setMCPServerDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDatasourceSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleMCPServerSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="w-full h-screen bg-background">
      <div className="flex flex-col h-full">
        <header className="border-b px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">MCP Datasource Generator</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDatasourceDialogOpen(true)}
            >
              <Database className="w-4 h-4 mr-2" />
              Add Datasource
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMCPServerDialogOpen(true)}
            >
              <Server className="w-4 h-4 mr-2" />
              Create MCP Server
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <FlowCanvas
            key={refreshKey}
            onCreateDatasource={() => setDatasourceDialogOpen(true)}
            onCreateMCPServer={() => setMCPServerDialogOpen(true)}
          />
        </main>
      </div>

      <CreateDatasourceDialog
        open={datasourceDialogOpen}
        onOpenChange={setDatasourceDialogOpen}
        onSuccess={handleDatasourceSuccess}
      />

      <CreateMCPServerDialog
        open={mcpServerDialogOpen}
        onOpenChange={setMCPServerDialogOpen}
        onSuccess={handleMCPServerSuccess}
      />
    </div>
  );
}

export default App;
