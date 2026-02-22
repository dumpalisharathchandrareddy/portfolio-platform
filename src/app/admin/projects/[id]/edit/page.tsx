"use client";

import ProjectForm from "@/components/admin/ProjectForm";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/projects", { cache: "no-store" });
        const json = await res.json();
        const found = (json.data || []).find((p: any) => p.id === id);
        setProject(found || null);
      } catch (e) {
        toast.error("Failed to load project");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!project) return <div className="p-6">Project not found</div>;

  return <ProjectForm mode="edit" initial={project} />;
}