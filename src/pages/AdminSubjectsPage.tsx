import { FormEvent, useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import SuperAdminLayout from "../layout/SuperAdminLayout";
import { useFetchSubjects } from "../services/queries";
import { useCreateSubjectMutation, useDeleteSubjectMutation } from "../services/mutation";

const AdminSubjectsPage = () => {
  const [name, setName] = useState("");
  const subjectsQuery = useFetchSubjects();
  const createSubject = useCreateSubjectMutation();
  const deleteSubject = useDeleteSubjectMutation();
  const subjects = subjectsQuery.data ?? [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    createSubject.mutate(cleanName, {
      onSuccess: () => setName(""),
    });
  };

  return (
    <SuperAdminLayout>
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-widest text-[#287271]">Settings</p>
        <h1 className="mt-1 text-3xl font-black">Subjects</h1>
        <p className="mt-1 text-sm text-slate-500">Manage the shared subject list used by jobs and staff expertise.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <form onSubmit={submit} className="rounded-xl border border-[#dbe4ef] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#e0f2fe] text-[#184e77]">
              <BookOpen size={18} />
            </span>
            <div>
              <h2 className="font-black">Add Subject</h2>
              <p className="text-xs text-slate-500">Keep naming simple and readable.</p>
            </div>
          </div>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Mathematics"
            className="h-12 w-full rounded-xl border border-[#dbe4ef] bg-[#f8fafc] px-4 text-sm outline-none focus:border-[#184e77]"
          />
          <button type="submit" className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#184e77] text-sm font-black text-white">
            <Plus size={16} />
            Add Subject
          </button>
        </form>

        <div className="rounded-xl border border-[#dbe4ef] bg-white p-5 shadow-sm">
          <h2 className="font-black">All Subjects</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject) => (
              <div key={subject._id} className="flex items-center justify-between gap-3 rounded-xl border border-[#eef2f7] p-3">
                <span className="font-bold">{subject.name}</span>
                <button
                  type="button"
                  onClick={() => deleteSubject.mutate(subject._id)}
                  className="grid size-8 place-items-center rounded-lg text-red-500 transition hover:bg-red-50"
                  aria-label={`Delete ${subject.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {!subjects.length && <p className="text-sm text-slate-500">No subjects yet.</p>}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default AdminSubjectsPage;
