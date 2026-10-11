import { Scenario } from "@/types";

interface RoleCardProps {
  role: Scenario["roles"][number];
}

export default function RoleCard({ role }: RoleCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white print:border-none print:shadow-none">
      <h3 className="font-bold text-lg text-gray-800 mb-2 print:text-black">{role.name}</h3>

      <div className="mt-2 space-y-2 text-sm">
        <div>
          <span className="font-medium text-gray-600">Remit:</span>
          <p className="text-gray-700">{role.remit}</p>
        </div>

        <div>
          <span className="font-medium text-gray-600">Private Brief:</span>
          <p className="text-gray-700">{role.private_brief}</p>
        </div>

        <div>
          <span className="font-medium text-gray-600">Pressure:</span>
          <p className="text-gray-700">{role.pressure}</p>
        </div>

        <div>
          <span className="font-medium text-gray-600">Win Conditions:</span>
          <ul className="list-disc list-inside text-gray-700 ml-2">
            {role.win_conditions.map((wc, i) => (
              <li key={i}>{wc}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="print:hidden mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => window.print()}
          className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          Print this card
        </button>
      </div>
    </div>
  );
}
