"use client";
import { useState } from "react";
import axios from "axios";
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
      const response = await axios.post("http://127.0.0.1:5000/predict", {
        message: message,
      });

      setPrediction(response.data.predicted_class);
      setConfidence(response.data.confidence_score);
      onOpen();
    } catch (error) {
      console.error("Error during prediction:", error);
      alert("Error connecting to the backend API.");
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
          theme === "light" ? "text-black bg-white" : "text-white bg-black"
        }`}
      >
        <div className="max-w-2xl w-full flex flex-col items-center gap-6 text-center">
          <h1 className="text-5xl font-extrabold">
  <span className="text-green-500">Spam</span>
  <span className={theme === "light" ? "text-black" : "text-white"}>Shield</span>
</h1>

          <h3 className="text-lg text-gray-400">
            Detect spam messages instantly using our AI-powered Naïve Bayes
            classifier.
          </h3>

          {/* Textarea Section */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste or type your message here..."
            className="w-full h-40 p-4 rounded-xl border border-gray-500 bg-transparent text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          ></textarea>

          {/* Classify Button */}
          <button
            onClick={handleClassify}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold"
            disabled={isLoading}
          >
            {isLoading ? <Spinner color="default" /> : "Classify Message"}
          </button>
        </div>

        {/* Modal for Results */}
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
                  {prediction ? prediction.toUpperCase() : "No Result"}
                </p>
                <p className="text-lg text-gray-300">
                  Confidence Score:{" "}
                  {confidence !== null ? confidence.toFixed(2) : "N/A"}
                </p>
              </ModalBody>
              <ModalFooter className="flex justify-center">
                <Button color="danger" variant="light" onPress={handleCloseModal}>
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
