import { Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Lock-and-upsell panel shown when a school's current plan doesn't include a
 * feature (e.g. rotational scheduling is Enterprise/PRO only).
 */
const PlanLock = ({
  title,
  description,
  requiredPlans = "Enterprise or PRO",
}: {
  title: string;
  description: string;
  requiredPlans?: string;
}) => (
  <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-[#dbe4ef] bg-white p-8 text-center shadow-sm">
    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#184e77]/10 text-[#184e77]">
      <Lock className="h-6 w-6" />
    </span>
    <h2 className="mt-4 text-lg font-black text-[#172033]">{title}</h2>
    <p className="mt-2 text-sm text-slate-500">{description}</p>
    <p className="mt-3 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
      Available on {requiredPlans}
    </p>
    <div className="mt-6">
      <Link
        to="/school/plans"
        className="inline-flex items-center gap-2 rounded-xl bg-[#184e77] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a6091]"
      >
        Upgrade your plan <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </div>
);

export default PlanLock;
