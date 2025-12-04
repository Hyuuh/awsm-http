import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookIcon,
  CodeIcon,
  BeakerIcon,
  Wand2Icon,
  ServerIcon,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/features/theme/theme-provider";
import { Badge } from "@/components/ui/badge";

function CodeBlock({
  code,
  language = "javascript",
}: {
  code: string;
  language?: string;
}) {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="rounded-md overflow-hidden text-sm border bg-muted/50">
      <SyntaxHighlighter
        language={language}
        style={isDark ? vscDarkPlus : vs}
        customStyle={{ margin: 0, padding: "1rem", background: "transparent" }}
        wrapLines={true}
        wrapLongLines={true}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

interface DocumentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentationDialog({
  open,
  onOpenChange,
}: DocumentationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookIcon /> Documentation
          </DialogTitle>
          <DialogDescription>
            Learn how to use the advanced features of awsm-http.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="getting-started" className="h-full flex flex-col">
            <div className="px-6 border-b">
              <TabsList className="w-full justify-start bg-transparent p-0 h-auto gap-6">
                <TabsTrigger
                  value="getting-started"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent  px-0 py-2"
                >
                  Getting Started
                </TabsTrigger>
                <TabsTrigger
                  value="faker"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent  px-0 py-2"
                >
                  <Wand2Icon />
                  Faker & Variables
                </TabsTrigger>
                <TabsTrigger
                  value="tests"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent  px-0 py-2"
                >
                  <BeakerIcon />
                  Testing
                </TabsTrigger>
                <TabsTrigger
                  value="scripting"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent  px-0 py-2"
                >
                  <CodeIcon />
                  Scripting API
                </TabsTrigger>
                <TabsTrigger
                  value="mock-server"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent  px-0 py-2"
                >
                  <ServerIcon />
                  Mock Server
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0">
              <TabsContent value="getting-started" className="h-full mt-0">
                <ScrollArea className="h-full p-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">
                        Welcome to awsm-http
                      </h3>
                      <p className="text-muted-foreground">
                        awsm-http is a powerful, lightweight HTTP client
                        designed for developers. It allows you to organize your
                        API requests into collections, manage environments, and
                        automate testing.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="p-4 border rounded-lg bg-muted/5">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          🚀 Core Features
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>
                            <strong>Collections & Folders</strong>: Organize
                            requests hierarchically.
                          </li>
                          <li>
                            <strong>Environments</strong>: Manage variables like{" "}
                            <code>{`{{base_url}}`}</code> across environments.
                          </li>
                          <li>
                            <strong>Import/Export</strong>: Support for Postman
                            collections and JSON backup.
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg bg-muted/5">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          📝 Request Editor
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>
                            <strong>HTTP Methods</strong>: GET, POST, PUT,
                            DELETE, PATCH, etc.
                          </li>
                          <li>
                            <strong>QS Builder</strong>: Visual query string
                            builder for complex params.
                          </li>
                          <li>
                            <strong>Auth</strong>: Basic, Bearer, API Key, OAuth
                            2.0.
                          </li>
                          <li>
                            <strong>Body</strong>: JSON (Monaco Editor), Form
                            Data, XML, Raw.
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg bg-muted/5">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          🔌 Real-time Protocols
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>
                            <strong>WebSocket</strong>: Raw WS connections with
                            message history.
                          </li>
                          <li>
                            <strong>Socket.IO</strong>: Native support for v4
                            events and groups.
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg bg-muted/5">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          🛠️ Mock Server
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>
                            <strong>Visual Schema</strong>: Design tables and
                            relationships visually.
                          </li>
                          <li>
                            <strong>REST API</strong>: Auto-generated endpoints
                            with pagination.
                          </li>
                          <li>
                            <strong>Data Gen</strong>: Generate fake data with
                            Faker.js.
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg bg-muted/5">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          ⚡ Productivity
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>
                            <strong>Command Palette</strong>:{" "}
                            <code>Ctrl+K</code> for quick actions.
                          </li>
                          <li>
                            <strong>Testing</strong>: Write JS tests to validate
                            responses.
                          </li>
                          <li>
                            <strong>Dark Mode</strong>: Sleek UI with theme
                            support.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="faker" className="h-full mt-0">
                <ScrollArea className="h-full p-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">
                        Dynamic Data with Faker
                      </h3>
                      <p className="text-muted-foreground">
                        Generate realistic test data dynamically using Faker.js
                        integration.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-mono">
                            Ctrl + K
                          </span>
                          Quick Insert
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Press{" "}
                          <kbd className="bg-muted px-1 rounded">Ctrl+K</kbd>{" "}
                          (or Cmd+K) in any JSON or Text body editor to open the
                          Faker generator dialog.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Syntax</h4>
                        <p className="text-sm text-muted-foreground">
                          You can use the double curly braces syntax to inject
                          Faker data:
                        </p>

                        <CodeBlock
                          language="json"
                          code={`{
  "name": "{{faker.person.fullName()}}",
  "email": "{{faker.internet.email()}}",
  "id": "{{faker.string.uuid()}}"
}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">With Arguments</h4>
                        <p className="text-sm text-muted-foreground">
                          You can pass arguments to Faker methods just like in
                          JavaScript:
                        </p>
                        <CodeBlock
                          language="json"
                          code={`{
  "custom_email": "{{faker.internet.email({ firstName: 'Jeanne' })}}",
  "future_date": "{{faker.date.future({ years: 10 })}}"
}`}
                        />
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tests" className="h-full mt-0">
                <ScrollArea className="h-full p-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Writing Tests</h3>
                      <p className="text-muted-foreground">
                        Write tests in JavaScript to validate your API
                        responses. Tests run automatically after a request is
                        sent.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">
                          The awsm.test() function
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Use the <code>awsm.test</code> function to define a
                          test case.
                        </p>
                        <CodeBlock
                          code={`awsm.test("Status code is 200", () => {
  if (awsm.response.status !== 200) {
    throw new Error("Expected 200 OK");
  }
});`}
                        />
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Dynamic Descriptions</h4>
                        <p className="text-sm text-muted-foreground">
                          You can use the callback argument to log a dynamic
                          description for the test result.
                        </p>
                        <CodeBlock
                          code={`awsm.test("Response time check", (log) => {
  if (awsm.response.time > 500) {
    throw new Error("Too slow!");
  }
  log("Response time was " + awsm.response.time + "ms");
});`}
                        />
                      </div>

                      <div className="p-4 border rounded-lg bg-muted/5 flex items-start gap-3">
                        <BeakerIcon className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm">View Results</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Test results appear in the "Tests" tab in the left
                            sidebar after running a request.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="scripting" className="h-full mt-0">
                <ScrollArea className="h-full p-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Scripting API</h3>
                      <p className="text-muted-foreground">
                        The <code>awsm</code> global object provides access to
                        the request, response, and environment variables.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-mono text-sm font-bold text-primary mb-2">
                          awsm.variables
                        </h4>
                        <ul className="text-sm space-y-2 text-muted-foreground">
                          <li>
                            <code>.get(key)</code> - Get an environment variable
                          </li>
                          <li>
                            <code>.set(key, value)</code> - Set an environment
                            variable
                          </li>
                        </ul>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-mono text-sm font-bold text-primary mb-2">
                          awsm.log(...args)
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Log messages to the console (visible in DevTools) and
                          the internal log array.
                        </p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-mono text-sm font-bold text-primary mb-2">
                          awsm.response
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Available only in Test scripts.
                        </p>
                        <ul className="text-sm space-y-1 text-muted-foreground font-mono">
                          <li>.status (number)</li>
                          <li>.statusText (string)</li>
                          <li>.body (any)</li>
                          <li>.headers (object)</li>
                          <li>.time (number)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="mock-server" className="h-full mt-0">
                <ScrollArea className="h-full p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Mock Server
                      </h3>
                      <p className="text-muted-foreground">
                        awsm-http includes a powerful Mock Server that allows
                        you to design a database schema visually, generate fake
                        data, and serve it via a REST API.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-base font-medium text-foreground">
                        1. Schema Design
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Use the visual graph editor to create tables and define
                        relationships.
                      </p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                        <li>
                          <strong>Add Table</strong>: Click the "Add Table"
                          button to create a new table.
                        </li>
                        <li>
                          <strong>Columns</strong>: Add columns with types
                          (TEXT, INTEGER, REAL, BOOLEAN, BLOB).
                        </li>
                        <li>
                          <strong>Primary Key</strong>: Mark a column as PK
                          (Primary Key).
                        </li>
                        <li>
                          <strong>Foreign Keys</strong>: Drag from a column
                          handle to another table to create a relationship.{" "}
                          <Badge>Soon</Badge>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-base font-medium text-foreground">
                        2. Data Generation
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Populate your tables with realistic fake data using
                        Faker.js.
                      </p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                        <li>
                          Select a table and click the <strong>Dice</strong>{" "}
                          icon.
                        </li>
                        <li>Choose the number of rows to generate.</li>
                        <li>
                          Configure <strong>Faker Expressions</strong> for each
                          column (e.g., <code>person.fullName</code>,{" "}
                          <code>internet.email</code>).
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-base font-medium text-foreground">
                        3. API Endpoints
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Once the server is started (default port 3000), your
                        tables are available as REST endpoints.
                      </p>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">List Records</h5>
                        <CodeBlock
                          language="http"
                          code={`GET http://localhost:3000/users?page=1&pageSize=10`}
                        />
                        <p className="text-sm text-muted-foreground">
                          Returns a paginated list of records.
                        </p>
                        <CodeBlock
                          language="json"
                          code={`{
  "data": [
    { "id": 1, "name": "John Doe", "email": "john@example.com" }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 5,
      "total": 50
    }
  }
}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">
                          Get Single Record
                        </h5>
                        <CodeBlock
                          language="http"
                          code={`GET http://localhost:3000/users/1`}
                        />
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Create Record</h5>
                        <CodeBlock
                          language="http"
                          code={`POST http://localhost:3000/users
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-base font-medium text-foreground">
                        4. Configuration
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        You can configure the server settings in the main
                        Settings dialog.
                      </p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                        <li>
                          <strong>Server Port</strong>: The port the mock server
                          listens on (default: 3000).
                        </li>
                        <li>
                          <strong>API Default Page Size</strong>: The default
                          number of items returned by the API if{" "}
                          <code>pageSize</code> is not specified.
                        </li>
                      </ul>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
