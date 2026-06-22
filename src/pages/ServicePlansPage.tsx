import { Check, Minus, Crown, Sparkles, Layers, Loader2, Star } from "lucide-react";
import AdminLayout from "../layout/AdminLayout";
import { useAuth } from "../lib/AuthContext";
import { useFetchInstitution } from "../services/queries";
import { useSetInstitutionPlanMutation } from "../services/mutation";
import type { PlanType } from "../types/TypeChecks";

type PlanKey = "BASIC" | "ENTERPRISE" | "PRO";

const PLANS: {
  key: PlanKey;
  name: string;
  short: string;
  tagline: string;
  price: string;
  icon: typeof Layers;
  accent: string;
  popular?: boolean;
  features: string[];
}[] = [
  {
    key: "BASIC",
    name: "Basic — Placement",
    short: "Basic",
    tagline: "One-time recruitment. You hire, you manage.",
    price: "One-time fee per hire",
    icon: Layers,
    accent: "#184e77",
    features: [
      "Post jobs & receive applicants",
      "AI job descriptions & screening questions",
      "Review CVs, accept / reject candidates",
      "Direct placement — platform steps out after hire",
    ],
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise — Managed",
    short: "Enterprise",
    tagline: "Ongoing management with shared, scheduled instructors.",
    price: "Revenue share",
    icon: Sparkles,
    accent: "#287271",
    popular: true,
    features: [
      "Everything in Basic",
      "Rotational sessions & scheduling engine",
      "Conflict-free timetabling (max 4 schools / instructor)",
      "Replacement & continuity support",
    ],
  },
  {
    key: "PRO",
    name: "PRO — Full Service",
    short: "PRO",
    tagline: "The complete managed experience with welfare benefits.",
    price: "Revenue share + benefits margin",
    icon: Crown,
    accent: "#7c3aed",
    features: [
      "Everything in Enterprise",
      "Instructor benefits: HMO & savings",
      "Housing support & loan facilitation",
      "Job-loss protection & priority support",
    ],
  },
];

// Feature comparison matrix
const COMPARISON: { label: string; a: boolean; b: boolean; c: boolean }[] = [
  { label: "Post jobs & receive applicants", a: true, b: true, c: true },
  { label: "AI job descriptions & screening", a: true, b: true, c: true },
  { label: "Accept / reject & direct placement", a: true, b: true, c: true },
  { label: "Rotational sessions & scheduling engine", a: false, b: true, c: true },
  { label: "Conflict detection + 4-school cap", a: false, b: true, c: true },
  { label: "Replacement & continuity support", a: false, b: true, c: true },
  { label: "Welfare benefits (HMO, savings)", a: false, b: false, c: true },
  { label: "Housing support & loans", a: false, b: false, c: true },
  { label: "Job-loss protection", a: false, b: false, c: true },
];

const Cell = ({ on }: { on: boolean }) =>
  on ? (
    <Check className="mx-auto h-4 w-4 text-[#287271]" />
  ) : (
    <Minus className="mx-auto h-4 w-4 text-slate-300" />
  );

const ServicePlansPage = () => {
  const { auth } = useAuth();
  const institutionId = auth?.institution?.id;
  const { data: institution, isLoading } = useFetchInstitution(institutionId);
  const setPlan = useSetInstitutionPlanMutation();

  const currentPlan: PlanType = institution?.planType ?? "NONE";

  const choose = (planType: PlanKey) => {
    if (!institutionId || planType === currentPlan) return;
    setPlan.mutate({ id: institutionId, planType });
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-screen-xl px-6 py-8">
        <p className="text-xs font-black uppercase tracking-widest text-[#287271]">Service Plan</p>
        <h1 className="mt-1 text-2xl font-black text-[#172033]">Choose your plan</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Your plan controls which platform features your school can use. You can change it anytime.
          {currentPlan === "NONE" && " You haven't selected a plan yet."}
        </p>

        {isLoading ? (
          <div className="mt-10 flex items-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your plan…
          </div>
        ) : (
          <>
            <div className="mt-6 grid items-start gap-5 lg:grid-cols-3">
              {PLANS.map((plan) => {
                const isCurrent = plan.key === currentPlan;
                const Icon = plan.icon;
                return (
                  <div
                    key={plan.key}
                    className={`relative flex flex-col rounded-2xl border bg-white p-6 transition ${
                      plan.popular ? "lg:-mt-2 lg:mb-2 shadow-lg" : "shadow-sm"
                    } ${isCurrent ? "border-[#287271] ring-2 ring-[#287271]/25" : "border-[#dbe4ef]"}`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#287271] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow">
                        <Star className="h-3 w-3 fill-white" /> Most popular
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="grid size-11 place-items-center rounded-xl text-white" style={{ backgroundColor: plan.accent }}>
                        <Icon className="h-5 w-5" />
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-[#287271]/10 px-3 py-1 text-[11px] font-black text-[#287271]">
                          Current plan
                        </span>
                      )}
                    </div>

                    <h2 className="mt-4 text-lg font-black text-[#172033]">{plan.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>

                    <div className="mt-4 rounded-xl bg-[#f8fafc] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Pricing</p>
                      <p className="mt-0.5 text-sm font-black text-[#172033]">{plan.price}</p>
                    </div>

                    <ul className="mt-4 flex-1 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: plan.accent }} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      disabled={isCurrent || setPlan.isPending}
                      onClick={() => choose(plan.key)}
                      className="mt-6 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      style={isCurrent ? undefined : { backgroundColor: plan.accent }}
                    >
                      {isCurrent ? "Your current plan" : setPlan.isPending ? "Updating…" : `Switch to ${plan.short}`}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Comparison table */}
            <div className="mt-10 overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-sm">
              <div className="border-b border-[#eef2f7] px-5 py-4">
                <h3 className="text-sm font-black text-[#172033]">Compare what's included</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#eef2f7] text-left">
                      <th className="px-5 py-3 font-bold text-slate-500">Feature</th>
                      {PLANS.map((p) => (
                        <th key={p.key} className="px-3 py-3 text-center font-black text-[#172033]">
                          {p.short}
                          {p.key === currentPlan && (
                            <span className="ml-1 align-middle text-[9px] font-black text-[#287271]">●</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row, i) => (
                      <tr key={row.label} className={i % 2 ? "bg-[#f8fafc]" : ""}>
                        <td className="px-5 py-3 text-slate-600">{row.label}</td>
                        <td className="px-3 py-3"><Cell on={row.a} /></td>
                        <td className="px-3 py-3"><Cell on={row.b} /></td>
                        <td className="px-3 py-3"><Cell on={row.c} /></td>
                      </tr>
                    ))}
                    <tr className="border-t border-[#eef2f7]">
                      <td className="px-5 py-3 font-bold text-[#172033]">Pricing model</td>
                      <td className="px-3 py-3 text-center text-xs text-slate-500">One-time fee</td>
                      <td className="px-3 py-3 text-center text-xs text-slate-500">Revenue share</td>
                      <td className="px-3 py-3 text-center text-xs text-slate-500">Rev share + benefits</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-6 text-xs text-slate-400">
              Billing is handled offline for now — selecting a plan unlocks its features immediately.
              Your platform admin can also adjust your plan.
            </p>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ServicePlansPage;
