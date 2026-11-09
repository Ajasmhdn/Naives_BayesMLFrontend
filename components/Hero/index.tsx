
"use client";

import { useState } from "react";
import { NextUIProvider, Spinner } from "@nextui-org/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { useTheme } from "next-themes";

interface PredictionResult {
  predicted_class: string;
  confidence_score: number;
}

const API_URL = "https://ajaaz-spamshield.hf.space/gradio_api/call/predict";

export default function Home(): JSX.Element {
  const [message, setMessage] = useState<string>("");
  const [prediction, setPrediction] = useState<string>("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { theme } = useTheme();

  const handleClassify = async () => {
    if (!message.trim()) {
      alert("Please enter a message to classify.");
      return;
    }

    setIsLoading(true);
    setPrediction("");
    setConfidence(null);

    try {
      // Step 1: Submit message to Hugging Face Gradio API
      const submitResponse = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [message],
        }),
      });

      if (!submitResponse.ok) {
        throw new Error(
          `API submission failed: ${submitResponse.status}`
        );
      }

      const submitData = await submitResponse.json();

      const eventId = submitData.event_id;

      if (!eventId) {
        throw new Error("No event ID received from Gradio API.");
      }

      // Step 2: Retrieve prediction using the event ID
      const resultResponse = await fetch(
        `${API_URL}/${eventId}`,
        {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
          },
          cache: "no-store",
        }
      );

      if (!resultResponse.ok) {
        throw new Error(
          `Prediction retrieval failed: ${resultResponse.status}`
        );
      }

      // Step 3: Read the Server-Sent Events response
      const resultText = await resultResponse.text();

      const eventBlocks = resultText.split(/\r?\n\r?\n/);

      let predictionData: unknown = null;

      for (const block of eventBlocks) {
        const eventType = block
          .split(/\r?\n/)
          .find((line) => line.startsWith("event: "))
          ?.substring(7)
          .trim();

        const dataLines = block
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data: "))
          .map((line) => line.substring(6));

        if (eventType === "error") {
          throw new Error(dataLines.join("\n") || "Gradio prediction failed.");
        }

        if (eventType === "complete" || (!eventType && dataLines.length > 0)) {
          predictionData = JSON.parse(dataLines.join("\n"));
        }
      }

      if (predictionData === null) {
        throw new Error("No completed prediction received from Gradio.");
      }

      // Step 4: Extract prediction JSON
      if (
        !Array.isArray(predictionData) ||
        predictionData.length === 0 ||
        typeof predictionData[0] !== "object" ||
        predictionData[0] === null
      ) {
        throw new Error("Invalid prediction response format.");
      }

      const predictionResult =
        predictionData[0] as PredictionResult;

      if (
        typeof predictionResult.predicted_class !== "string" ||
        typeof predictionResult.confidence_score !== "number"
      ) {
        throw new Error("Unexpected prediction response structure.");
      }

      // Step 5: Update UI
      setPrediction(predictionResult.predicted_class);
      setConfidence(predictionResult.confidence_score);

      onOpen();

    } catch (error) {
      console.error("SpamShield API Error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error occurred.";

      alert(`Error connecting to SpamShield API: ${errorMessage}`);

    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setPrediction("");
    setConfidence(null);
    onClose();
  };

  return (
    <NextUIProvider>
      <main
        className={`flex min-h-screen flex-col items-center justify-center px-4 ${
          theme === "light"
            ? "text-black bg-white"
            : "text-white bg-black"
        }`}
      >
        <div className="max-w-2xl w-full flex flex-col items-center gap-6 text-center">

          {/* Application Title */}
          <h1 className="text-5xl font-extrabold">
            <span className="text-green-500">Spam</span>
            <span
              className={
                theme === "light"
                  ? "text-black"
                  : "text-white"
              }
            >
              Shield
            </span>
          </h1>

          {/* Description */}
          <h3 className="text-lg text-gray-400">
            Detect spam messages instantly using our AI-powered Naïve Bayes
            classifier.
          </h3>

          {/* Message Input */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste or type your message here..."
            className="w-full h-40 p-4 rounded-xl border border-gray-500 bg-transparent text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          {/* Classify Button */}
          <button
            onClick={handleClassify}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Spinner color="default" />
            ) : (
              "Classify Message"
            )}
          </button>

        </div>

        {/* Classification Result Modal */}
        <Modal
          size="md"
          backdrop="blur"
          isOpen={isOpen}
          onClose={handleCloseModal}
          className="bg-gray-800 rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-30 border border-gray-200"
        >
          <ModalContent>
            <>
              <ModalHeader className="text-white font-bold text-lg">
                Classification Result
              </ModalHeader>

              <ModalBody className="flex flex-col items-center justify-center text-center text-white">
                <p className="text-2xl font-bold">
                  {prediction
                    ? prediction.toUpperCase()
                    : "No Result"}
                </p>

                <p className="text-lg text-gray-300">
                  Confidence Score:{" "}
                  {confidence !== null
                    ? confidence.toFixed(2)
                    : "N/A"}
                </p>
              </ModalBody>

              <ModalFooter className="flex justify-center">
                <Button
                  color="danger"
                  variant="light"
                  onPress={handleCloseModal}
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          </ModalContent>
        </Modal>

      </main>
    </NextUIProvider>
  );
}
