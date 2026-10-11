import { Scenario } from "@/types";

interface RoleCardProps {
  role: Scenario["roles"][number];
}

export default function RoleCard({ role }: RoleCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <h3 className="font-bold text-lg text-gray-800">{role.name}</h3>
      <div className="mt-2 space-y-2">
        <div>
          <span className="font-medium text-sm text-gray-600">Remit:</span>
          <p className="text-sm text-gray-700">{role.remit}</p>
        </div>
        <details className="text-sm">
          <summary className="font-medium text-gray-600 cursor-pointer">Private Brief</summary>
          <p className="mt-1 text-gray-700">{role.private_brief}</p>
        </details>
        <details className="text-sm">
          <summary className="font-medium text-gray-600 cursor-pointer">Pressure</summary>
          <p className="mt-1 text-gray-700">{role.pressure}</p>
        </details>
        <div>
          <span className="font-medium text-sm text-gray-600">Win Conditions:</span>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {role.win_conditions.map((wc, i) => (
              <li key={i}>{wc}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
