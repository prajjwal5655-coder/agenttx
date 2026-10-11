import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Scenario } from "@/types";
import { computeSessionScore } from "@/lib/scoring";
import { loadRegulation } from "@/lib/regulations";

export interface ReportData {
  session: {
    id: string;
    facilitator: string;
    scenarioId: string;
    scenarioVersion: string;
    startedAt: Date;
    endedAt: Date | null;
    status: string;
  };
  scenario: Scenario;
  decisions: Array<{
    checkpointId: string;
    prompt: string;
    selectedOption: string;
    elapsedSeconds: number;
    criteriaConfirmed: Record<string, boolean>;
  }>;
  scores: Record<string, number>;
  remediations: Array<{
    gap: string;
    severity: string;
    recommendation: string;
    ownerRole: string;
    dueDate: string | null;
    status: string;
  }>;
  blastRadiusSummary: string | null;
}

export const ReportDocument = ({ data }: { data: ReportData }) => {
  const scenario = data.scenario;
  const session = data.session;

  const criteriaByDimension = new Map<string, { key: string; weight: number }[]>();
  for (const checkpoint of scenario.decision_checkpoints) {
    for (const c of checkpoint.objective_criteria) {
      if (!criteriaByDimension.has(c.dimension_key)) {
        criteriaByDimension.set(c.dimension_key, []);
      }
      criteriaByDimension.get(c.dimension_key)!.push({ key: c.key, weight: c.weight });
    }
  }

  const confirmedCriteria = new Set<string>();
  for (const d of data.decisions) {
    for (const [key, confirmed] of Object.entries(d.criteriaConfirmed)) {
      if (confirmed) confirmedCriteria.add(key);
    }
  }

  const dimensionScores = new Map<string, number>();
  for (const [key, value] of Object.entries(data.scores)) {
    dimensionScores.set(key, value);
  }

  const score = computeSessionScore(
    scenario.scoring_dimensions.map((d) => ({ key: d.key, weight: d.weight })),
    criteriaByDimension,
    confirmedCriteria,
    dimensionScores,
    []
  );

  const duration = session.endedAt
    ? Math.floor((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
    : Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);

  const remediations = data.remediations.length > 0
    ? data.remediations
    : scenario.recommendations.map((rec) => ({
        gap: rec.gap,
        recommendation: rec.remediation,
        ownerRole: rec.owner_role,
        dueDate: null,
        status: "open",
        severity: rec.severity,
      }));

  return (
    <Document>
      <Page style={styles.body}>
        <Text style={styles.title}>AgentTTX After-Action Report</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Board One-Pager</Text>
          <Text style={styles.subheading}>What Happened</Text>
          <Text style={styles.bodyText}>
            {scenario.title} - A facilitated tabletop exercise testing response to{" "}
            {scenario.based_on.incident_class.toLowerCase()}.
          </Text>

          <Text style={styles.subheading}>Headline Score</Text>
          <Text style={styles.score}>{score.headlineScore.toFixed(1)} / 5 ({score.headlinePercentage}%)</Text>

          <Text style={styles.subheading}>Top 3 Gaps</Text>
          <Text style={styles.bodyText}>
            1. {scenario.recommendations[0]?.gap || "No recommendations documented"}
          </Text>
          <Text style={styles.bodyText}>
            2. {scenario.recommendations[1]?.gap || "No recommendations documented"}
          </Text>
          <Text style={styles.bodyText}>
            3. {scenario.recommendations[2]?.gap || "No recommendations documented"}
          </Text>

          <Text style={styles.subheading}>Top 3 Fixes</Text>
          {scenario.recommendations.slice(0, 3).map((rec, i) => (
            <Text key={i} style={styles.bodyText}>
              {i + 1}. {rec.remediation}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Test Evidence Block</Text>

          <Text style={styles.subheading}>Exercise Details</Text>
          <Text style={styles.bodyText}>Date: {new Date(session.startedAt).toLocaleDateString()}</Text>
          <Text style={styles.bodyText}>
            Duration: {Math.floor(duration / 60)}m {String(duration % 60).padStart(2, "0")}s
          </Text>
          <Text style={styles.bodyText}>Facilitator: {session.facilitator}</Text>

          <Text style={styles.subheading}>Scenario</Text>
          <Text style={styles.bodyText}>{scenario.title}</Text>
          <Text style={styles.bodyText}>Pinned Version: {session.scenarioVersion}</Text>

          <Text style={styles.subheading}>Participant Roster</Text>
          {scenario.roles.map((role) => (
            <Text key={role.id} style={styles.bodyText}>
              {role.name} - {role.remit}
            </Text>
          ))}

          <Text style={styles.subheading}>Decisions Made</Text>
          {data.decisions.map((d, i) => {
            const checkpoint = scenario.decision_checkpoints.find((c) => c.id === d.checkpointId);
            return (
              <View key={d.checkpointId} style={styles.decisionItem}>
                <Text style={styles.bodyText}>
                  Decision {i + 1}: {checkpoint?.prompt || d.checkpointId}
                </Text>
                <Text style={styles.bodyText}>Selected: {d.selectedOption}</Text>
                <Text style={styles.bodyText}>
                  Elapsed: {Math.floor(d.elapsedSeconds / 60)}m {String(d.elapsedSeconds % 60).padStart(2, "0")}s
                </Text>
              </View>
            );
          })}

          <Text style={styles.subheading}>Objective Criteria Met/Missed</Text>
          {scenario.decision_checkpoints.map((cp) =>
            cp.objective_criteria.map((c) => {
              const decision = data.decisions.find((d) => d.checkpointId === cp.id);
              const confirmed = decision?.criteriaConfirmed[c.key] ?? false;
              return (
                <Text key={c.key} style={styles.bodyText}>
                  [{confirmed ? "MET" : "MISSED"}] {c.label}
                </Text>
              );
            })
          )}

          <Text style={styles.subheading}>Gaps Found</Text>
          {scenario.recommendations.map((rec, i) => (
            <Text key={i} style={styles.bodyText}>
              [{rec.severity.toUpperCase()}] {rec.gap}
            </Text>
          ))}

          <Text style={styles.subheading}>Remediation Items</Text>
          {remediations.map((r, i) => (
            <View key={i} style={styles.remediationItem}>
              <Text style={styles.bodyText}>Gap: {r.gap}</Text>
              <Text style={styles.bodyText}>Recommendation: {r.recommendation}</Text>
              <Text style={styles.bodyText}>Owner: {r.ownerRole}</Text>
              <Text style={styles.bodyText}>Due: {r.dueDate ?? "TBD"}</Text>
              <Text style={styles.bodyText}>Status: {r.status}</Text>
            </View>
          ))}

          <Text style={styles.subheading}>Sign-Off Block</Text>
          <View style={styles.signoffBlock}>
            <Text style={styles.bodyText}>
              Facilitator: ___________________________ Date: ____________
            </Text>
            <Text style={styles.bodyText}>
              Client Representative: ___________________________ Date: ____________
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Decision-vs-Inject Timeline</Text>
          {[
            ...scenario.injects.map((inj) => ({ minute: inj.at_minute, type: "inject" as const, title: inj.title })),
            ...data.decisions.map((d) => ({
              minute: Math.floor(d.elapsedSeconds / 60),
              type: "decision" as const,
              title: d.selectedOption,
            })),
          ]
            .sort((a, b) => a.minute - b.minute)
            .map((event, i) => (
              <Text key={i} style={styles.timelineItem}>
                [{event.minute}m] {event.type === "inject" ? `INJECT: ${event.title}` : `DECISION: ${event.title}`}
              </Text>
            ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Weighted Scorecard</Text>
          {score.dimensions.map((dim) => {
            const scenarioDim = scenario.scoring_dimensions.find((d) => d.key === dim.dimensionKey);
            return (
              <View key={dim.dimensionKey} style={styles.scoreRow}>
                <Text style={styles.bodyText}>
                  {dim.dimensionKey}: {dim.finalScore.toFixed(1)}/5
                </Text>
                <Text style={styles.bodyText}>
                  Objective ratio: {dim.objectiveRatio.toFixed(2)}, Facilitator: {dim.facilitatorScore}/5
                </Text>
                <Text style={styles.bodyText}>Rationale: {scenarioDim?.description ?? ""}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Regulation Citation Table</Text>
          {scenario.recommendations.map((rec, i) => (
            <View key={i} style={styles.citationRow}>
              <Text style={styles.bodyText}>Gap: {rec.gap}</Text>
              {rec.regulation_refs.map((ref) => {
                const [regId] = ref.split(":");
                let regulation;
                try {
                  regulation = loadRegulation(regId);
                } catch {
                  return (
                    <Text key={ref} style={styles.bodyText}>
                      [{ref}] - regulation file not found
                    </Text>
                  );
                }
                const citation = regulation.citations.find((c) => c.ref === ref);
                if (!citation) {
                  return (
                    <Text key={ref} style={styles.bodyText}>
                      [{ref}] - citation not found
                    </Text>
                  );
                }
                return (
                  <Text key={ref} style={styles.citationText}>
                    [{ref}] {citation.article}: {citation.summary}
                  </Text>
                );
              })}
            </View>
          ))}
          <Text style={styles.disclaimer}>
            Note: Regulation citations are illustrative only. A qualified legal professional must review
            these before relying on them for compliance purposes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Appendix</Text>
          <Text style={styles.subheading}>Scenario Version</Text>
          <Text style={styles.bodyText}>
            {scenario.title} v{scenario.version}
          </Text>
          <Text style={styles.bodyText}>
            All content is DRAFT and requires human review. See legal disclaimer.
          </Text>
          {data.blastRadiusSummary && (
            <>
              <Text style={styles.subheading}>Blast Map Summary</Text>
              <Text style={styles.bodyText}>{data.blastRadiusSummary}</Text>
            </>
          )}
        </View>
      </Page>
    </Document>
  );
};

const styles = StyleSheet.create({
  body: { fontFamily: "Helvetica", fontSize: 10, padding: 36 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 8 },
  subheading: { fontSize: 11, fontWeight: "bold", marginTop: 8, marginBottom: 4 },
  bodyText: { fontSize: 9, marginBottom: 2 },
  score: { fontSize: 14, fontWeight: "bold", color: "#2563eb" },
  decisionItem: { marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: "#ccc" },
  remediationItem: { marginBottom: 6, paddingLeft: 8 },
  signoffBlock: { marginTop: 16, borderTopWidth: 1, borderTopColor: "#000", paddingTop: 12 },
  timelineItem: { fontSize: 8, marginBottom: 2 },
  scoreRow: { marginBottom: 6 },
  citationRow: { marginBottom: 8 },
  citationText: { fontSize: 8, fontStyle: "italic" },
  disclaimer: { fontSize: 7, color: "#666", marginTop: 12, fontStyle: "italic" },
});
