import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookIcon, CodeIcon, BeakerIcon, Wand2Icon } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/features/theme/theme-provider";

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
              </TabsList>
            </div>

            <ScrollArea className="flex-1 p-6">
              <TabsContent value="getting-started" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    Welcome to awsm-http
                  </h3>
                  <p className="text-muted-foreground">
                    awsm-http is a powerful, lightweight HTTP client designed
                    for developers. It allows you to organize your API requests
                    into collections, manage environments, and automate testing.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-4 border rounded-lg bg-muted/5">
                    <h4 className="font-medium mb-2">Collections</h4>
                    <p className="text-sm text-muted-foreground">
                      Organize your requests into folders and collections.
                      Right-click in the sidebar to create new items.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg bg-muted/5">
                    <h4 className="font-medium mb-2">Environments</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage variables like base URLs and tokens across
                      different environments (Dev, Prod, etc.).
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="faker" className="mt-0 space-y-6">
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
                      Press <kbd className="bg-muted px-1 rounded">Ctrl+K</kbd>{" "}
                      (or Cmd+K) in any JSON or Text body editor to open the
                      Faker generator dialog.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Syntax</h4>
                    <p className="text-sm text-muted-foreground">
                      You can use the double curly braces syntax to inject Faker
                      data:
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
              </TabsContent>

              <TabsContent value="tests" className="mt-0 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Writing Tests</h3>
                  <p className="text-muted-foreground">
                    Write tests in JavaScript to validate your API responses.
                    Tests run automatically after a request is sent.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">The awsm.test() function</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the <code>awsm.test</code> function to define a test
                      case.
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
              </TabsContent>

              <TabsContent value="scripting" className="mt-0 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Scripting API</h3>
                  <p className="text-muted-foreground">
                    The <code>awsm</code> global object provides access to the
                    request, response, and environment variables.
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
                      Log messages to the console (visible in DevTools) and the
                      internal log array.
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
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
