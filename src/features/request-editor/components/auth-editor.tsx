import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HttpClient } from "@/features/network/services/http-client";
import { RequestAuth } from "@/types";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "sonner";

export const AuthEditor = React.memo(function AuthEditor({
  auth,
  onChange,
}: {
  auth: RequestAuth;
  onChange: (a: RequestAuth) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const handleGetToken = async () => {
    if (!auth.oauth2) return;
    const { grantType, accessTokenUrl, clientId, clientSecret, scope } =
      auth.oauth2;

    if (grantType === "client_credentials") {
      if (!accessTokenUrl || !clientId || !clientSecret) {
        toast.error("Please fill in all required fields");
        return;
      }

      try {
        const body = new URLSearchParams();
        body.append("grant_type", "client_credentials");
        body.append("client_id", clientId);
        body.append("client_secret", clientSecret);
        if (scope) body.append("scope", scope);

        const res = await HttpClient.send({
          url: accessTokenUrl,
          method: "POST",
          headers: [
            {
              key: "Content-Type",
              value: "application/x-www-form-urlencoded",
              enabled: true,
              id: "1",
            },
          ],
          body: { type: "x-www-form-urlencoded", content: body.toString() },
          params: [],
          auth: { type: "none" },
        } as any);

        if (res.status === 200 && res.body) {
          const data = res.body as any;
          if (data.access_token) {
            onChange({
              ...auth,
              oauth2: { ...auth.oauth2, token: data.access_token },
            });
            toast.success("Access Token received!");
          } else {
            toast.error("No access token in response");
          }
        } else {
          toast.error("Failed to get token: " + res.statusText);
        }
      } catch (e) {
        toast.error("Error fetching token");
      }
    } else {
      toast.info(
        "Authorization Code flow not fully implemented yet. Please use external browser."
      );
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-2">
        <Label>Authorization Type</Label>
        <Select
          value={auth.type}
          onValueChange={(v: any) => onChange({ ...auth, type: v })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Auth Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Auth</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="apikey">API Key</SelectItem>
            <SelectItem value="oauth2">OAuth 2.0</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {auth.type === "basic" && (
        <div className="grid gap-4 max-w-md animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={auth.basic?.username || ""}
              onChange={(e) =>
                onChange({
                  ...auth,
                  basic: { ...auth.basic, username: e.target.value },
                })
              }
              placeholder="Username"
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={auth.basic?.password || ""}
                onChange={(e) =>
                  onChange({
                    ...auth,
                    basic: { ...auth.basic, password: e.target.value },
                  })
                }
                placeholder="Password"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOffIcon size={14} />
                ) : (
                  <EyeIcon size={14} />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {auth.type === "bearer" && (
        <div className="space-y-2 max-w-md animate-in fade-in slide-in-from-top-2">
          <Label>Token</Label>
          <Input
            value={auth.bearer?.token || ""}
            onChange={(e) =>
              onChange({
                ...auth,
                bearer: { ...auth.bearer, token: e.target.value },
              })
            }
            placeholder="Bearer Token"
          />
        </div>
      )}

      {auth.type === "oauth2" && (
        <div className="space-y-4 max-w-md animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label>Grant Type</Label>
            <Select
              value={auth.oauth2?.grantType || "client_credentials"}
              onValueChange={(v: any) =>
                onChange({
                  ...auth,
                  oauth2: { ...auth.oauth2, grantType: v } as any,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client_credentials">
                  Client Credentials
                </SelectItem>
                <SelectItem value="authorization_code">
                  Authorization Code
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {auth.oauth2?.grantType === "authorization_code" && (
            <div className="space-y-2">
              <Label>Callback URL</Label>
              <Input
                value={auth.oauth2?.redirectUrl || ""}
                onChange={(e) =>
                  onChange({
                    ...auth,
                    oauth2: {
                      ...auth.oauth2,
                      redirectUrl: e.target.value,
                    } as any,
                  })
                }
                placeholder="https://..."
              />
              <Label>Auth URL</Label>
              <Input
                value={auth.oauth2?.authUrl || ""}
                onChange={(e) =>
                  onChange({
                    ...auth,
                    oauth2: { ...auth.oauth2, authUrl: e.target.value } as any,
                  })
                }
                placeholder="https://..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Access Token URL</Label>
            <Input
              value={auth.oauth2?.accessTokenUrl || ""}
              onChange={(e) =>
                onChange({
                  ...auth,
                  oauth2: {
                    ...auth.oauth2,
                    accessTokenUrl: e.target.value,
                  } as any,
                })
              }
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client ID</Label>
              <Input
                value={auth.oauth2?.clientId || ""}
                onChange={(e) =>
                  onChange({
                    ...auth,
                    oauth2: { ...auth.oauth2, clientId: e.target.value } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Client Secret</Label>
              <Input
                type="password"
                value={auth.oauth2?.clientSecret || ""}
                onChange={(e) =>
                  onChange({
                    ...auth,
                    oauth2: {
                      ...auth.oauth2,
                      clientSecret: e.target.value,
                    } as any,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Scope</Label>
            <Input
              value={auth.oauth2?.scope || ""}
              onChange={(e) =>
                onChange({
                  ...auth,
                  oauth2: { ...auth.oauth2, scope: e.target.value } as any,
                })
              }
              placeholder="scope1 scope2"
            />
          </div>

          <Button onClick={handleGetToken} className="w-full">
            Get New Access Token
          </Button>

          <div className="space-y-2">
            <Label>Current Token</Label>
            <Input
              value={auth.oauth2?.token || ""}
              readOnly
              className="bg-muted"
              placeholder="Token will appear here..."
            />
          </div>
        </div>
      )}

      {auth.type === "apikey" && (
        <div className="grid gap-4 max-w-md animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label>Key</Label>
            <Input
              value={auth.apikey?.key || ""}
              onChange={(e) =>
                onChange({
                  ...auth,
                  apikey: { ...auth.apikey, key: e.target.value },
                })
              }
              placeholder="Key"
            />
          </div>
          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              value={auth.apikey?.value || ""}
              onChange={(e) =>
                onChange({
                  ...auth,
                  apikey: { ...auth.apikey, value: e.target.value },
                })
              }
              placeholder="Value"
            />
          </div>
          <div className="space-y-2">
            <Label>Add To</Label>
            <Select
              value={auth.apikey?.addTo || "header"}
              onValueChange={(v: any) =>
                onChange({ ...auth, apikey: { ...auth.apikey, addTo: v } })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="query">Query Params</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {auth.type === "none" && (
        <div className="text-muted-foreground text-sm italic">
          This request does not use any authorization.
        </div>
      )}
    </div>
  );
});
