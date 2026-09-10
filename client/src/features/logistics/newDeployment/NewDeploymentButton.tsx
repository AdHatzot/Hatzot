import { useState } from "react";
import { NewDeploymentModal } from "./NewDeploymentModal";

export function NewDeploymentButton(): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
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
          onClose={() => setIsModalOpen(false)}
          onCreated={(deployment) => {
            console.log("New deployment:", deployment);

            /*
             * Later, this is where we can send the deployment
             * and its CSV data to your backend/database.
             */

            setIsModalOpen(false);
          }}
        />
      )}
    </>
  );
}