import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          AgentTTX
        </h1>
        <p className="text-xl md:text-2xl text-blue-300 mb-8">
          The only agent tabletop that starts from your agent's real permissions
          and ends with a report your insurer will accept.
        </p>

        <div className="space-y-4 mb-12">
          <h2 className="text-2xl font-semibold">What AgentTTX does</h2>
          <ul className="space-y-2 text-gray-300">
            <li>
              <strong>Blast Radius Map:</strong> Import your agent's tool inventory
              and compute worst-case exposure if hijacked.
            </li>
            <li>
              <strong>Live Console:</strong> Run guided crisis simulations with
              timed injects, role cards, and objective scoring.
            </li>
            <li>
              <strong>Insurer Evidence Pack:</strong> Generate PDF and Markdown
              reports mapped to cyber insurance requirements.
            </li>
          </ul>
        </div>

        <div className="flex gap-4">
          <Link
            href="/blast-radius"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Build Blast Radius Map
          </Link>
        </div>
      </div>
    </div>
  );
}
