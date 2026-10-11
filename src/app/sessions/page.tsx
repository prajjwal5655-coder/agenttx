import Link from "next/link";

export default function SessionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Sessions</h1>
        <p className="text-gray-600 mb-4">No sessions yet. Start a new tabletop exercise.</p>
        <Link
          href="/sessions/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New Session
        </Link>
      </div>
    </div>
  );
}
