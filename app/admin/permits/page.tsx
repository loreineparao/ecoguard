import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PermitDocumentViewer from "./PermitDocumentViewer";
import PermitActions from "./PermitActions";

export default async function AdminPermitsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "40px 20px",
          background: "#f4f7fb",
        }}
      >
        <h1>Access Error</h1>
        <p>Unable to verify your account role.</p>
      </main>
    );
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: applications, error: applicationsError } =
    await supabase
      .from("permit_applications")
      .select(
        "id, user_id, applicant_name, documentary_requirements, application_status, submitted_at"
      )
      .order("submitted_at", { ascending: false });

  if (applicationsError) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "40px 20px",
          background: "#f4f7fb",
        }}
      >
        <h1>Tree Cutting Permit Applications</h1>

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
          }}
        >
          Unable to load permit applications:{" "}
          {applicationsError.message}
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
              marginBottom: "10px",
            }}
          >
            Tree Cutting Permit Applications
          </h1>

          <p
            style={{
              color: "#555",
              marginBottom: "25px",
            }}
          >
            Review and manage tree cutting permit applications
            submitted by residents.
          </p>

          {applications && applications.length === 0 && (
            <div
              style={{
                padding: "20px",
                background: "#f3f4f6",
                borderRadius: "8px",
                color: "#555",
              }}
            >
              No permit applications have been submitted yet.
            </div>
          )}

          <div
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            {applications?.map((application) => (
              <div
                key={application.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "20px",
                  background: "#fff",
                }}
              >
                <h2
                  style={{
                    marginBottom: "15px",
                    fontSize: "20px",
                  }}
                >
                  Tree Cutting Permit
                </h2>

                <p>
                  <strong>Applicant:</strong>{" "}
                  {application.applicant_name}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {application.application_status}
                </p>

                <p>
                  <strong>Submitted:</strong>{" "}
                  {new Date(
                    application.submitted_at
                  ).toLocaleString()}
                </p>

                <p
                  style={{
                    wordBreak: "break-all",
                    fontSize: "13px",
                    color: "#666",
                  }}
                >
                  <strong>Application ID:</strong>{" "}
                  {application.id}
                </p>

                <div
                  style={{
                    marginTop: "15px",
                    padding: "15px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                  }}
                >
                  <strong>Documentary Requirements</strong>

                  <pre
                    style={{
                      marginTop: "10px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: "13px",
                    }}
                  >
                    {JSON.stringify(
                      application.documentary_requirements,
                      null,
                      2
                    )}
                  </pre>
                </div>
                <PermitDocumentViewer
  applicationId={application.id}
/>

<PermitActions
  applicationId={application.id}
  currentStatus={application.application_status}
/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}