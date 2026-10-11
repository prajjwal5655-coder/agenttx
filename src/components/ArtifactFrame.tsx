import { readFileSync } from "fs";
import { join } from "path";

interface ArtifactFrameProps {
  scenarioId: string;
  artifactName: string;
}

export default function ArtifactFrame({ scenarioId, artifactName }: ArtifactFrameProps) {
  const artifactPath = join(
    process.cwd(),
    "content",
    "scenarios",
    "artifacts",
    scenarioId,
    artifactName
  );

  let content: string;
  try {
    content = readFileSync(artifactPath, "utf8");
  } catch {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <p className="text-gray-500">Artifact not found: {artifactName}</p>
      </div>
    );
  }

  const isLog = artifactName.endsWith(".log") || artifactName.endsWith(".txt");
  const isMarkdown = artifactName.endsWith(".md");

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h4 className="font-medium text-gray-700 mb-2">{artifactName}</h4>
      <pre
        className={`text-xs overflow-auto p-2 border border-gray-200 rounded bg-white ${
          isLog ? "font-mono text-gray-800" : ""
        }`}
      >
        {content}
      </pre>
    </div>
  );
}
