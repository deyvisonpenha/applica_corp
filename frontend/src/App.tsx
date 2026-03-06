import { useState } from "react";
import { TenantSelector } from "./components/TenantSelector";
import { CreateTaskForm } from "./components/CreateTaskForm";
import { TaskList } from "./components/TaskList";
import type { Tenant } from "./types";

const TENANT_LABELS: Record<Tenant, string> = {
  tenant_a: "Tenant A",
  tenant_b: "Tenant B",
};

export default function App() {
  const [tenant, setTenant] = useState<Tenant>("tenant_a");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800 tracking-tight">
            Task Manager
          </h1>
          <TenantSelector tenant={tenant} onChange={setTenant} />
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Active tenant banner */}
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
          <p className="text-sm text-slate-500">
            Viewing as{" "}
            <span className="font-medium text-slate-700">
              {TENANT_LABELS[tenant]}
            </span>
          </p>
        </div>

        <CreateTaskForm tenant={tenant} />

        <section>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Tasks
          </h2>
          <TaskList tenant={tenant} />
        </section>
      </main>
    </div>
  );
}
