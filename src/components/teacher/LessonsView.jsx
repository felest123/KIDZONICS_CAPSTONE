import { useEffect, useState } from "react";
import { BookOpen, Plus, Pencil, Eye, UserPlus, Trash2, Users, Star, Volume2, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { MODULES } from "@/lib/curriculum";
import LessonFormDialog from "@/components/teacher/LessonFormDialog";
import LessonPreviewDialog from "@/components/teacher/LessonPreviewDialog";
import { cn } from "@/lib/utils";

export default function LessonsView({ teacher, summaries }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const page = await base44.entities.LessonPlan.filter({}, { limit: 100, sort: "-created_date" }).catch(() => null);
    const mine = (page?.items ?? []).filter(
      (plan) => !plan.teacher_email || plan.teacher_email === teacher?.email
    );
    setPlans(mine);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      await load();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [teacher?.email]);

  const save = async (values) => {
    setBusy(true);
    try {
      if (editing) {
        await base44.entities.LessonPlan.update(editing.id, values);
      } else {
        await base44.entities.LessonPlan.create(values);
      }
      await load();
      setFormOpen(false);
      setEditing(null);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (lesson) => {
    if (!window.confirm(`Remove "${lesson.title}" from your lessons? This cannot be undone.`)) return;
    await base44.entities.LessonPlan.delete(lesson.id);
    setPreview(null);
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#2c4a52] sm:text-3xl">Lessons</h1>
          <p className="text-sm font-bold text-[#8aa8ac]">The phonics curriculum your students see on the kiosk.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="flex items-center gap-1 rounded-full bg-[#5bbf8a] px-4 py-3 text-xs font-extrabold text-white shadow-[0_4px_0_#3f9c6b]"
        >
          <Plus className="h-4 w-4" /> ADD LESSON
        </button>
      </div>

      <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Your lessons</h2>
          <span className="rounded-full bg-[#eef4f3] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#5b7f86]">
            {plans.length} created
          </span>
        </div>

        {loading ? (
          <div className="mt-4 flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[#5bbf8a]" />
          </div>
        ) : plans.length === 0 ? (
          <p className="mt-3 rounded-xl bg-[#f8fbfb] px-4 py-8 text-center text-xs font-bold text-[#8aa8ac]">
            No lessons created yet. Tap ADD LESSON to prepare one for your class or a single student.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {plans.map((lesson) => {
              const names = (lesson.student_ids || [])
                .map((id) => summaries.find((student) => student.id === id)?.name)
                .filter(Boolean);
              return (
                <div key={lesson.id} className="rounded-[1.2rem] bg-[#f8fbfb] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "flex h-9 min-w-12 items-center justify-center rounded-lg px-2 font-display text-sm font-extrabold",
                        lesson.category === "vowels" ? "bg-[#e6f7ee] text-[#166534]" : "bg-[#e8f4ff] text-[#1e4b8a]"
                      )}
                    >
                      {lesson.target}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-[#2c4a52]">{lesson.title}</p>
                      <p className="truncate text-[11px] font-bold text-[#8aa8ac]">
                        {lesson.category === "vowels" ? "Vowels" : "CVC words"} ·{" "}
                        {lesson.audience === "student"
                          ? `Only ${names[0] || lesson.student_names?.[0] || "one student"}`
                          : "All students"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase",
                        lesson.ai_prepared ? "bg-[#fdf6ec] text-[#8a6a12]" : "bg-white text-[#9db6ba] ring-1 ring-[#e2eef0]"
                      )}
                    >
                      <Sparkles className="h-3 w-3" />
                      {lesson.ai_prepared ? "Agent prepared" : "No agent"}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setPreview(lesson)}
                      className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#5b7f86] ring-1 ring-[#e2eef0]"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                    <button
                      onClick={() => {
                        setEditing(lesson);
                        setFormOpen(true);
                      }}
                      className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#5b7f86] ring-1 ring-[#e2eef0]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setEditing(lesson);
                        setFormOpen(true);
                      }}
                      className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#5b7f86] ring-1 ring-[#e2eef0]"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Assign
                    </button>
                    <button
                      onClick={() => setPreview(lesson)}
                      className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#5b7f86] ring-1 ring-[#e2eef0]"
                    >
                      <Users className="h-3.5 w-3.5" /> Assigned students
                    </button>
                    <button
                      onClick={() => remove(lesson)}
                      className="flex items-center gap-1 rounded-full bg-[#ffe4e0] px-3 py-1.5 text-[11px] font-extrabold text-[#a34c3f]"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Object.values(MODULES).map((module) => (
          <div key={module.id} className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f7f6]">
                <BookOpen className="h-5 w-5 text-[#3f9c6b]" />
              </span>
              <div>
                <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">{module.title}</h2>
                <p className="text-[11px] font-bold text-[#8aa8ac]">{module.subtitle}</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {module.items.map((item) => {
                const completed = summaries.filter((student) =>
                  (module.id === "vowels" ? student.vowelMap : student.cvcMap).some(
                    (node) => node.key === item.key && node.state === "completed"
                  )
                ).length;
                return (
                  <div key={item.key} className="flex items-center gap-3 rounded-xl bg-[#f8fbfb] px-3 py-2">
                    <span className="flex h-9 w-12 items-center justify-center rounded-lg bg-[#e6f7ee] font-display text-sm font-extrabold text-[#166534]">
                      {item.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-[#2c4a52]">
                        {module.id === "vowels" ? `${item.word} sound` : `${item.word}`}
                      </p>
                      <p className="text-[11px] font-bold text-[#8aa8ac]">{item.tip}</p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-extrabold text-[#7d9ba0] ring-1 ring-[#e2eef0]">
                      <Star className="h-3 w-3 fill-[#f5c451] text-[#f5c451]" />
                      {completed}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#9db6ba]">
              <Volume2 className="h-3.5 w-3.5" /> Each lesson: listen, match the picture, then 3 speaking trials
            </p>
          </div>
        ))}
      </div>

      <LessonFormDialog
        open={formOpen}
        lesson={editing}
        students={summaries}
        teacher={teacher}
        busy={busy}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={save}
      />

      {preview && (
        <LessonPreviewDialog
          lesson={preview}
          students={summaries}
          onClose={() => setPreview(null)}
          onEdit={() => {
            setEditing(preview);
            setPreview(null);
            setFormOpen(true);
          }}
          onRemove={() => remove(preview)}
        />
      )}
    </div>
  );
}
