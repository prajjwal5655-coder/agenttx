import { notFound } from "next/navigation";

interface ReportPageProps {
  params: { id: string };
}

async function getSession(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/sessions/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.session;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = params;
  const session = await getSession(id);

  if (!session) {
    return notFound();
  }

  const scenario = session.scenario;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Report: {scenario?.title ?? "Loading..."}
        </h1>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Report Preview</h2>
          <p className="text-gray-600 mb-4">
            The report page previews exactly what will be exported.
          </p>

          <div className="space-y-4">
            <div>
              <span className="font-medium">Exercise date:</span>{" "}
              {new Date(session.startedAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Facilitator:</span> {session.facilitator}
            </div>
            <div>
              <span className="font-medium">Scenario version:</span> {session.scenarioVersion}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <a
            href={`/api/reports?sessionId=${id}&format=pdf`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Export PDF
          </a>
          <a
            href={`/api/reports?sessionId=${id}&format=markdown`}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Export Markdown
          </a>
          <a
            href={`/api/reports?sessionId=${id}&format=json`}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800"
          >
            Export JSON
          </a>
        </div>
      </div>
    </div>
  );
}
