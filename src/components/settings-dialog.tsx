import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, Laptop } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] 2xl:max-w-4xl p-0 overflow-hidden gap-0 sm:h-[400px] 2xl:h-[800px]">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-[200px] border-r bg-muted/30 p-4">
            <h2 className="font-semibold mb-4 px-2">Settings</h2>
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-sm font-medium bg-accent text-accent-foreground rounded-md cursor-pointer">
                Appearance
              </div>
              {/* Add more settings tabs here later */}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <DialogHeader className="mb-6">
              <DialogTitle>Appearance</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-4">
                  <div
                    className={`flex flex-col items-center gap-2 cursor-pointer p-2 rounded-md border-2 ${
                      theme === "light"
                        ? "border-primary"
                        : "border-transparent hover:bg-muted"
                    }`}
                    onClick={() => setTheme("light")}
                  >
                    <div className="h-20 w-32 rounded-md bg-[#f0f0f0] border shadow-sm flex items-center justify-center">
                      <Sun className="text-orange-500" />
                    </div>
                    <span className="text-xs font-medium">Light</span>
                  </div>

                  <div
                    className={`flex flex-col items-center gap-2 cursor-pointer p-2 rounded-md border-2 ${
                      theme === "dark"
                        ? "border-primary"
                        : "border-transparent hover:bg-muted"
                    }`}
                    onClick={() => setTheme("dark")}
                  >
                    <div className="h-20 w-32 rounded-md bg-[#1e1e1e] border shadow-sm flex items-center justify-center">
                      <Moon className="text-blue-400" />
                    </div>
                    <span className="text-xs font-medium">Dark</span>
                  </div>

                  <div
                    className={`flex flex-col items-center gap-2 cursor-pointer p-2 rounded-md border-2 ${
                      theme === "system"
                        ? "border-primary"
                        : "border-transparent hover:bg-muted"
                    }`}
                    onClick={() => setTheme("system")}
                  >
                    <div className="h-20 w-32 rounded-md bg-linear-to-r from-[#f0f0f0] to-[#1e1e1e] border shadow-sm flex items-center justify-center">
                      <Laptop className="text-muted-foreground mix-blend-difference" />
                    </div>
                    <span className="text-xs font-medium">System</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
