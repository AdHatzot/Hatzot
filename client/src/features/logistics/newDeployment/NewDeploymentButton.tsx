import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NewDeploymentModal } from "./NewDeploymentModal";
import type { NewDeployment } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function NewDeploymentButton(): JSX.Element {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleCreate = async (deployment: NewDeployment) => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(
        `${API_URL}/api/logistics/deployment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: deployment.name,
            rows: deployment.rows,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ?? `שגיאה ביצירת פריסה (${response.status})`,
        );
      }

      const result = await response.json();
      console.log("Deployment created:", result);

      // Close modal and navigate to verification page
      setIsModalOpen(false);
      navigate(`/logistics/deployment/${result.id}`, {
        state: {
          deploymentId: result.id,
          deploymentName: deployment.name,
          rows: deployment.rows,
          fileName: deployment.file.name,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "שגיאה לא צפויה";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSubmitError("");
          setIsModalOpen(true);
        }}
        className="
          inline-flex
          items-center
          justify-center
          rounded-md
          bg-white
          px-5
          py-2.5
          text-sm
          font-medium
          text-gray-900
          shadow-sm
          transition
          hover:bg-gray-100
          active:scale-[0.98]
        "
      >
        יצירת פריסה חדשה
      </button>

      {isModalOpen && (
        <NewDeploymentModal
          onClose={() => {
            if (!isSubmitting) {
              setIsModalOpen(false);
            }
          }}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onCreated={(deployment) => {
            void handleCreate(deployment);
          }}
        />
      )}
    </>
  );
}