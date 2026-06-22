import { CreditCard, FileCheck2, Repeat, ShieldCheck, Users } from "lucide-react";
import SuperAdminLayout from "../layout/SuperAdminLayout";

const futureModules = [
  { title: "Expanded KYC", body: "Government ID, credentials, consent, background checks.", icon: ShieldCheck },
  { title: "Guarantors", body: "Two guarantor records with contact and verification state.", icon: Users },
  { title: "Benefits", body: "Eligibility and activation status after staff approval.", icon: FileCheck2 },
  { title: "Billing", body: "School invoices, payment state, and reminders.", icon: CreditCard },
  { title: "Replacements", body: "Replacement alerts for unavailable or rejected placements.", icon: Repeat },
];

const AdminSettingsPage = () => {
  return (
    <SuperAdminLayout>
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-widest text-[#287271]">Platform</p>
        <h1 className="mt-1 text-3xl font-black">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Lightweight placeholders for upcoming PRD modules, without adding unused systems yet.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {futureModules.map((module) => {
          const Icon = module.icon;
          return (
            <div key={module.title} className="rounded-xl border border-[#dbe4ef] bg-white p-5 shadow-sm">
              <span className="grid size-11 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77]">
                <Icon size={20} />
              </span>
              <h2 className="mt-4 font-black">{module.title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{module.body}</p>
              <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                Future module
              </span>
            </div>
          );
        })}
      </div>
    </SuperAdminLayout>
  );
};

export default AdminSettingsPage;
