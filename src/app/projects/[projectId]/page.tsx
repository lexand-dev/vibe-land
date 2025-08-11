interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

const ProjectPage = async ({ params }: ProjectPageProps) => {
  const { projectId } = await params;
  return (
    <div className="flex h-full w-full items-center justify-center">
      <h1 className="text-2xl font-bold">Project Page</h1>
      <p className="mt-4">Project ID: {projectId}</p>
      {/* Additional project details can be rendered here */}
    </div>
  );
};

export default ProjectPage;
