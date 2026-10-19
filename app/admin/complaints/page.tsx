import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ComplaintActions from "./ComplaintActions";
import EvidenceViewer from "./EvidenceViewer";

export default async function AdminComplaintsPage() {
  const supabase = await createClient();

  // 1. Check logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Check admin role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Access Error</h1>
        <p>Unable to verify your account.</p>
      </main>
    );
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  // 3. Get all complaints
  const { data: complaints, error: complaintsError } = await supabase
    .from("complaints")
    .select(
      "id, user_id, category, description, status, assigned_personnel, created_at"
    )
    .order("created_at", { ascending: false });

  if (complaintsError) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "40px 20px",
          background: "#f4f7fb",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            background: "white",
            padding: "30px",
            borderRadius: "12px",
          }}
        >
          <h1>Environmental Complaints</h1>

          <p style={{ color: "#b91c1c", marginTop: "15px" }}>
            Unable to load complaints: {complaintsError.message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#f4f7fb",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h1
            style={{
              color: "#166534",
              marginBottom: "8px",
            }}
          >
            Environmental Complaints
          </h1>

          <p
            style={{
              color: "#666",
              marginBottom: "25px",
            }}
          >
            Review and manage environmental complaints submitted
            by residents.
          </p>

          {complaints.length === 0 ? (
            <div
              style={{
                padding: "20px",
                background: "#f9fafb",
                borderRadius: "8px",
                color: "#666",
              }}
            >
              No environmental complaints have been submitted.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "20px",
              }}
            >
              {complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    padding: "20px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "20px",
                      marginBottom: "12px",
                    }}
                  >
                    {complaint.category}
                  </h2>

                  <p
                    style={{
                      marginBottom: "12px",
                      lineHeight: "1.6",
                    }}
                  >
                    <strong>Description:</strong>{" "}
                    {complaint.description}
                  </p>

                  <p style={{ marginBottom: "8px" }}>
                    <strong>Status:</strong>{" "}
                    {complaint.status}
                  </p>

                  <p style={{ marginBottom: "8px" }}>
                    <strong>Assigned Personnel:</strong>{" "}
                    {complaint.assigned_personnel ||
                      "Not yet assigned"}
                  </p>

                  <p style={{ marginBottom: "8px" }}>
                    <strong>Submitted:</strong>{" "}
                    {new Date(
                      complaint.created_at
                    ).toLocaleString()}
                  </p>

                  <p
                    style={{
                      fontSize: "13px",
                      color: "#777",
                      wordBreak: "break-all",
                    }}
                  >
                    <strong>Complaint ID:</strong>{" "}
                    {complaint.id}
                  </p>
<ComplaintActions
  complaintId={complaint.id}
  currentStatus={complaint.status}
  currentAssignedPersonnel={
    complaint.assigned_personnel
  }
/>

<EvidenceViewer
  complaintId={complaint.id}
/>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}