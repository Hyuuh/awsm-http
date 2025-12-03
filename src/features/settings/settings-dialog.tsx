import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/features/theme/theme-provider";
import {
  MoonIcon,
  SunIcon,
  LaptopIcon,
  Trash2Icon,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/features/workspace/stores/workspace-store";
import { AVAILABLE_LOCALES } from "@/features/scripting/services/faker-service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  const fakerLocale = useWorkspaceStore((state) => state.fakerLocale);
  const setFakerLocale = useWorkspaceStore((state) => state.setFakerLocale);
  const initializeMockData = useWorkspaceStore(
    (state) => state.initializeMockData
  );

  const handleResetConfirm = () => {
    initializeMockData(true);
    toast.success("Workspace reset successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] 2xl:max-w-4xl p-0 overflow-hidden gap-0 sm:h-[400px] 2xl:h-[800px]">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-[200px] border-r bg-muted/30 p-4">
            <h2 className="font-semibold mb-4 px-2">Settings</h2>
            <div className="space-y-1">
              <div
                className={cn(
                  "px-2 py-1.5 text-sm font-medium rounded-md cursor-pointer",
                  activeTab === "general"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => setActiveTab("general")}
              >
                General
              </div>
              <div
                className={cn(
                  "px-2 py-1.5 text-sm font-medium rounded-md cursor-pointer",
                  activeTab === "appearance"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => setActiveTab("appearance")}
              >
                Appearance
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {activeTab === "appearance" && (
              <>
                <DialogHeader className="mb-6">
                  <DialogTitle>Appearance</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="grid 2xl:grid-cols-3 gap-4 grid-cols-2">
                      <button
                        className={`flex flex-col items-center gap-2 cursor-pointer p-2 rounded-md border-2 ${
                          theme === "light"
                            ? "border-primary"
                            : "border-transparent hover:bg-muted"
                        }`}
                        onClick={() => setTheme("light")}
                      >
                        <SunIcon />
                        <span className="text-sm font-medium">Light</span>
                      </button>
                      <button
                        className={`flex flex-col items-center gap-2 cursor-pointer p-2 rounded-md border-2 ${
                          theme === "dark"
                            ? "border-primary"
                            : "border-transparent hover:bg-muted"
                        }`}
                        onClick={() => setTheme("dark")}
                      >
                        <MoonIcon />
                        <span className="text-sm font-medium">Dark</span>
                      </button>
                      <button
                        className={`flex flex-col items-center gap-2 cursor-pointer p-2 rounded-md border-2 ${
                          theme === "system"
                            ? "border-primary"
                            : "border-transparent hover:bg-muted"
                        }`}
                        onClick={() => setTheme("system")}
                      >
                        <LaptopIcon />
                        <span className="text-sm font-medium">System</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "general" && (
              <>
                <DialogHeader className="mb-6">
                  <DialogTitle>General</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Faker Locale</Label>
                    <Select value={fakerLocale} onValueChange={setFakerLocale}>
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select a locale" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_LOCALES.map((locale) => (
                          <SelectItem key={locale.value} value={locale.value}>
                            {locale.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Select the language for generated fake data (e.g. names,
                      addresses).
                    </p>
                  </div>

                  <div className="pt-6 border-t">
                    <h3 className="text-sm font-medium text-destructive mb-4">
                      Danger Zone
                    </h3>
                    <div className="flex flex-col gap-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">
                            Reset Workspace
                          </h4>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2Icon className="w-4 h-4 mr-2" />
                              Reset All
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete your workspace data and reset
                                it to the default state.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleResetConfirm}>
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                          Delete all collections, requests, and environments and
                          reset to default.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
