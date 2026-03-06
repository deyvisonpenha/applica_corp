import type { Tenant } from "../types";

type Props = {
  tenant: Tenant;
  onChange: (tenant: Tenant) => void;
};

const TENANTS: { value: Tenant; label: string }[] = [
  { value: "tenant_a", label: "Tenant A" },
  { value: "tenant_b", label: "Tenant B" },
];

/**
 * Two-button toggle for switching between tenants.
 * The selected tenant drives the query key in all hooks, so switching here
 * automatically shows the correct task list for the chosen tenant.
 */
export function TenantSelector({ tenant, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      {TENANTS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={[
            "px-5 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400",
            tenant === value
              ? "bg-slate-800 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
