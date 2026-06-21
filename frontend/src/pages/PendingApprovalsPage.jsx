import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { clearAuth, getCurrentUserFromStorage, getToken } from "../lib/auth";
import { apiRequest, jsonRequest } from "../lib/api";
import { navigateTo } from "../lib/navigation";

const getFileExtension = (url = "") => {
  const sanitizedUrl = url.split("?")[0];
  const segments = sanitizedUrl.split(".");
  return segments.length > 1 ? segments.pop().toLowerCase() : "";
};

const isImageDocument = (url) =>
  ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(getFileExtension(url));

const isPdfDocument = (url) => getFileExtension(url) === "pdf";

const getCloudinaryPdfPreviewUrl = (url) => {
  if (!url || !isPdfDocument(url) || !url.includes("/upload/")) {
    return null;
  }

  const transformedUrl = url.replace(
    "/upload/",
    "/upload/pg_1,f_jpg,q_auto,w_1400/"
  );

  return transformedUrl.replace(/\.pdf(\?.*)?$/i, ".jpg$1");
};

function DocumentPreview({ url, title }) {
  if (!url) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-container-high bg-white px-4 py-6 text-sm text-on-surface-variant">
        No document uploaded.
      </div>
    );
  }

  const imageDocument = isImageDocument(url);
  const pdfPreviewUrl = getCloudinaryPdfPreviewUrl(url);

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-surface-container-high bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-surface-container-high px-4 py-3">
        <p className="font-semibold text-on-surface">{title}</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-primary hover:text-[#F2994A]"
        >
          Open full document
        </a>
      </div>

      {imageDocument ? (
        <img
          src={url}
          alt={title}
          className="max-h-[520px] w-full bg-surface object-contain"
        />
      ) : pdfPreviewUrl ? (
        <div className="bg-surface p-4">
          <img
            src={pdfPreviewUrl}
            alt={`${title} preview`}
            className="max-h-[520px] w-full rounded-xl border border-surface-container-high bg-white object-contain"
          />
          <p className="mt-3 text-sm text-on-surface-variant">
            PDF files are shown here as a preview image. Use `Open full document`
            to inspect the original PDF.
          </p>
        </div>
      ) : (
        <iframe
          src={url}
          title={title}
          className="h-[520px] w-full bg-surface"
        />
      )}
    </div>
  );
}

function DetailGrid({ items }) {
  return (
    <div className="grid gap-3 rounded-[1.25rem] border border-surface-container-high bg-white p-5 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className={item.fullWidth ? "md:col-span-2" : ""}>
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            {item.label}
          </p>
          <p className="mt-1 text-on-surface">{item.value || "Not provided"}</p>
        </div>
      ))}
    </div>
  );
}

export default function PendingApprovalsPage() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    users: [],
    activeAction: "",
    notes: {},
  });

  useEffect(() => {
    const authUser = getCurrentUserFromStorage();
    const token = getToken();

    if (!token) {
      navigateTo("/login");
      return;
    }

    if (authUser?.role !== "ADMIN") {
      navigateTo("/me");
      return;
    }

    loadPendingApprovals(token);
  }, []);

  const loadPendingApprovals = async (token) => {
    try {
      const response = await apiRequest("/auth/pending-approvals", { token });
      setState((current) => ({
        ...current,
        loading: false,
        error: "",
        users: response.data.users,
      }));
    } catch (error) {
      if (/token|unauthorized|forbidden/i.test(error.message)) {
        clearAuth();
      }

      setState((current) => ({
        ...current,
        loading: false,
        error: error.message,
      }));
    }
  };

  const handleNoteChange = (userId, value) => {
    setState((current) => ({
      ...current,
      notes: {
        ...current.notes,
        [userId]: value,
      },
    }));
  };

  const handleApproval = async (userId, status) => {
    const token = getToken();
    const actionKey = `${userId}:${status}`;

    setState((current) => ({
      ...current,
      activeAction: actionKey,
      error: "",
    }));

    try {
      await jsonRequest(`/auth/users/${userId}/approval`, {
        method: "PATCH",
        token,
        body: {
          status,
          approvalNotes: state.notes[userId] || undefined,
        },
      });

      await loadPendingApprovals(token);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.message,
      }));
    } finally {
      setState((current) => ({
        ...current,
        activeAction: "",
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-[2rem] shadow-lg p-8 border border-surface-container-high">
<<<<<<< HEAD
          <h1 className="text-3xl font-bold mb-4">Pending Approvals</h1>
=======
          <h1 className="text-3xl font-bold mb-8">Pending Approvals</h1>
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f

          {state.loading && <p>Loading pending registrations...</p>}
          {state.error && (
            <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 mb-6">
              {state.error}
            </div>
          )}

          {!state.loading && state.users.length === 0 && (
            <div className="rounded-xl bg-green-50 text-green-700 px-4 py-3">
              No pending registrations right now.
            </div>
          )}

          <div className="grid gap-6">
            {state.users.map((user) => (
              <div
                key={user.id}
                className="rounded-[1.5rem] border border-surface-container-high p-6 bg-surface"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">{user.name}</h2>
                    <p className="text-on-surface-variant">{user.email}</p>
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#F2994A]">
                      {user.role} · {user.approvalStatus}
                    </p>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    Submitted {new Date(user.createdAt).toLocaleString()}
                  </p>
                </div>

                {user.role === "NGO" && (
                  <div className="mt-5 grid gap-5">
                    <DetailGrid
                      items={[
                        {
                          label: "Organization",
                          value: user.ngoOrganizationName,
                        },
                        {
                          label: "Registration Number",
                          value: user.ngoRegistrationNumber,
                        },
                        {
                          label: "Contact Phone",
                          value: user.ngoContactPhone,
                        },
                        {
                          label: "Address",
                          value: user.ngoAddress,
                        },
                        {
                          label: "Description",
                          value: user.ngoDescription,
                          fullWidth: true,
                        },
                      ]}
                    />

                    <DocumentPreview
                      url={user.ngoSsmDocumentUrl}
                      title="NGO SSM Document"
                    />
                  </div>
                )}

                {user.role === "VENDOR" && (
                  <div className="mt-5 grid gap-5">
                    <DetailGrid
                      items={[
                        {
                          label: "Business Name",
                          value: user.vendorBusinessName,
                        },
                        {
                          label: "Registration Number",
                          value: user.vendorRegistrationNumber,
                        },
                        {
                          label: "Contact Phone",
                          value: user.vendorContactPhone,
                        },
                        {
                          label: "Business Address",
                          value: user.vendorPlaceAddress,
                        },
                        {
                          label: "Description",
                          value: user.vendorDescription,
                          fullWidth: true,
                        },
                      ]}
                    />

                    <DocumentPreview
                      url={user.vendorSsmDocumentUrl}
                      title="Vendor SSM Document"
                    />
                  </div>
                )}

                <textarea
                  value={state.notes[user.id] || ""}
                  onChange={(event) =>
                    handleNoteChange(user.id, event.target.value)
                  }
                  className="mt-5 w-full min-h-[110px] rounded-2xl border border-surface-container-high bg-white px-4 py-3"
                  placeholder="Optional approval notes"
                />

                <div className="mt-5 flex gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleApproval(user.id, "APPROVED")}
                    disabled={Boolean(state.activeAction)}
                    className="px-5 py-3 rounded-full bg-green-600 text-white font-semibold disabled:opacity-60"
                  >
                    {state.activeAction === `${user.id}:APPROVED`
                      ? "Approving..."
                      : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproval(user.id, "REJECTED")}
                    disabled={Boolean(state.activeAction)}
                    className="px-5 py-3 rounded-full bg-red-600 text-white font-semibold disabled:opacity-60"
                  >
                    {state.activeAction === `${user.id}:REJECTED`
                      ? "Rejecting..."
                      : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
