import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Check, Save, UserRound, Bell, ShieldCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Panel } from "@/components/app/ui-bits";
import { toast } from "sonner";
import { useInventory } from "@/lib/inventory-store";

type SettingsData = { workspace: string; adminName: string; email: string; phone: string; location: string; overdueNotifications: boolean; pendingNotifications: boolean };
const DEFAULTS: SettingsData = { workspace: "RentalInventory", adminName: "Shivani C", email: "admin@rentalinventory.edu", phone: "", location: "SVYASA / NIAT Campus", overdueNotifications: true, pendingNotifications: true };
const KEY = "rentalinventory:settings";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · RentalInventory" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULTS);
  const { resetData } = useInventory();
  useEffect(() => {
    try { const saved = localStorage.getItem(KEY); if (saved) setSettings({ ...DEFAULTS, ...JSON.parse(saved) }); } catch { /* use defaults */ }
  }, []);
  const update = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => setSettings((s) => ({ ...s, [key]: value }));
  const save = () => { localStorage.setItem(KEY, JSON.stringify(settings)); toast.success("Settings saved successfully"); };
  const reset = () => { if (confirm("Refresh inventory and rental records from the backend?")) { void resetData().then(() => toast.success("Inventory refreshed")).catch((error) => toast.error("Couldn't refresh inventory", { description: error instanceof Error ? error.message : "Please try again" })); } };
  return <div className="space-y-6">
    <PageHeader title="Settings" description="Manage your workspace, administrator profile, and preferences." actions={<Button onClick={save}><Save className="mr-2 size-4"/>Save changes</Button>} />
    <Panel title="Workspace" description="General information for your rental organization">
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="workspace">Workspace name</Label><Input id="workspace" value={settings.workspace} onChange={(e)=>update("workspace",e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="location">Organization / campus</Label><Input id="location" value={settings.location} onChange={(e)=>update("location",e.target.value)} /></div>
      </div>
    </Panel>
    <Panel title="Administrator profile" description="Contact details for the inventory administrator">
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="adminName">Full name</Label><Input id="adminName" value={settings.adminName} onChange={(e)=>update("adminName",e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" value={settings.email} onChange={(e)=>update("email",e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="phone">Phone number</Label><Input id="phone" value={settings.phone} onChange={(e)=>update("phone",e.target.value)} placeholder="Add contact number" /></div>
      </div>
    </Panel>
    <Panel title="Notifications" description="Choose which inventory events should be highlighted">
      <div className="divide-y">
        <label className="flex cursor-pointer items-center justify-between gap-4 p-5"><div><p className="text-sm font-medium">Overdue rental alerts</p><p className="text-xs text-muted-foreground">Show alerts when items pass their return date.</p></div><input type="checkbox" checked={settings.overdueNotifications} onChange={(e)=>update("overdueNotifications",e.target.checked)} className="size-4 accent-primary"/></label>
        <label className="flex cursor-pointer items-center justify-between gap-4 p-5"><div><p className="text-sm font-medium">Pending rental requests</p><p className="text-xs text-muted-foreground">Show notifications for requests awaiting approval.</p></div><input type="checkbox" checked={settings.pendingNotifications} onChange={(e)=>update("pendingNotifications",e.target.checked)} className="size-4 accent-primary"/></label>
      </div>
    </Panel>
    <Panel title="Inventory data" description="Refresh the equipment and rental records from the backend">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">Refresh inventory</p><p className="text-xs text-muted-foreground">Reload the latest equipment and rental records from MongoDB.</p></div><Button variant="outline" onClick={reset}><RotateCcw className="mr-2 size-4"/>Refresh data</Button></div>
    </Panel>
    <div className="flex justify-end"><Button onClick={save}><Check className="mr-2 size-4"/>Save settings</Button></div>
  </div>;
}
