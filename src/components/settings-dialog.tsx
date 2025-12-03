import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme-provider";
import { MoonIcon, SunIcon, LaptopIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { AVAILABLE_LOCALES } from "@/services/faker-service";
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
  const [activeTab, setActiveTab] = useState("appearance");
  const fakerLocale = useWorkspaceStore((state) => state.fakerLocale);
  const setFakerLocale = useWorkspaceStore((state) => state.setFakerLocale);

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
                  activeTab === "appearance"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => setActiveTab("appearance")}
              >
                Appearance
              </div>
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
                      <div
                        className={`flex flex-col items-center gap-2 cursor-pointer p-2 rounded-md border-2 ${
                          theme === "light"
                            ? "border-primary"
                            : "border-transparent hover:bg-muted"
                        }`}
                        onClick={() => setTheme("light")}
                      >
                        <SunIcon className="h-6 w-6" />
                        <span className="text-sm font-medium">Light</span>
                      </div>
                      <div
                        className={`flex flex-col items-center gap-2 cursor-pointer p-2 rounded-md border-2 ${
                          theme === "dark"
                            ? "border-primary"
                            : "border-transparent hover:bg-muted"
                        }`}
                        onClick={() => setTheme("dark")}
                      >
                        <MoonIcon className="h-6 w-6" />
                        <span className="text-sm font-medium">Dark</span>
                      </div>
                      <div
                        className={`flex flex-col items-center gap-2 cursor-pointer p-2 rounded-md border-2 ${
                          theme === "system"
                            ? "border-primary"
                            : "border-transparent hover:bg-muted"
                        }`}
                        onClick={() => setTheme("system")}
                      >
                        <LaptopIcon className="h-6 w-6" />
                        <span className="text-sm font-medium">System</span>
                      </div>
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
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
