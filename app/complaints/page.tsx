
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getMyComplaintEvidence } from "@/app/actions/evidence";

export default async function ComplaintsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: complaints, error } = await supabase
    .from("complaints")
    .select(
      "id, category, description, status, assigned_personnel, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>My Complaints</h1>
        <p>Error loading complaints: {error.message}</p>
      </main>
    );
  }

  const complaintsWithEvidence = await Promise.all(
    (complaints ?? []).map(async (complaint) => {
      const result = await getMyComplaintEvidence(complaint.id);

      return {
        ...complaint,
        evidence:
          result.success && result.evidence
            ? result.evidence
            : [],
      };
    })
  );

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
        background: "#f4f7fb",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#166534" }}>
        My Environmental Complaints
      </h1>

      <p>
        Track the status of your submitted environmental complaints.
      </p>

      {complaintsWithEvidence.length === 0 ? (
        <p>No complaints submitted yet.</p>
      ) : (
        <div style={{ marginTop: "30px" }}>
          {complaintsWithEvidence.map((complaint) => (
            <article
              key={complaint.id}
              style={{
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "20px",
                overflowWrap: "anywhere",
              }}
            >
              <h2>{complaint.category}</h2>

              <p>
                <strong>Description:</strong>{" "}
                {complaint.description}
              </p>

              <p>
                <strong>Status:</strong> {complaint.status}
              </p>

              <p>
                <strong>Assigned Personnel:</strong>{" "}
                {complaint.assigned_personnel || "Not yet assigned"}
              </p>

              <p>
                <strong>Submitted:</strong>{" "}
                {new Date(complaint.created_at).toLocaleString()}
              </p>

              <p>
                <strong>Complaint ID:</strong> {complaint.id}
              </p>

              <h3 style={{ marginTop: "20px" }}>
                Uploaded Evidence
              </h3>

              {complaint.evidence.length === 0 ? (
                <p>No evidence available for this complaint.</p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  {complaint.evidence.map((item) => (
                    <div key={item.id}>
                      {item.signedUrl ? (
                        <a
                          href={item.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={item.signedUrl}
                            alt="Complaint evidence"
                            style={{
                              display: "block",
                              width: "220px",
                              maxWidth: "100%",
                              height: "180px",
                              objectFit: "contain",
                              border: "1px solid #ddd",
                              borderRadius: "8px",
                              background: "#f9fafb",
                            }}
                          />
                        </a>
                      ) : (
                        <p>
                          Evidence could not be displayed. Please
                          refresh the page and try again.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}