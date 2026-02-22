import ProjectForm from "@/components/admin/ProjectForm";

export default function NewProjectPage() {
  return (
    <ProjectForm
      mode="create"
      initial={{
        title: "",
        slug: "",
        shortDesc: "",
        caseStudyMd: "# Overview\n\n## Architecture\n\n## Key Decisions\n\n## Results\n",
        tags: [],
        techStack: [],
        featured: false,
        status: "DRAFT",
        coverImage: null,
        liveUrl: null,
        repoUrl: null,
        sortOrder: 0,
      }}
    />
  );
}