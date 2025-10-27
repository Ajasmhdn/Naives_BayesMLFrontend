"use client"
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpFromBracket, faLink } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { NextUIProvider, Spinner } from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from "@nextui-org/react";
import html2canvas from "html2canvas";
import Image from "next/image";
import { useTheme } from "next-themes";

type BackdropType = "blur" | "transparent" | "none";

export default function Home(): JSX.Element {
  const [previewUrl, setPreviewUrl] = useState<string>('../../../../images/homescreen.mp4');
  const [image, setImage] = useState<File | null>(null);
  const [returnUrl, setReturnUrl] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gradeName, setGradeName] = useState("");
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const { isOpen, onOpen, onClose: closeModal } = useDisclosure();

  const handleCloseModal = () => {
    resetState();  // Clears old data on modal close
    closeModal();  // Only closes modal without affecting the whole app
    window.location.reload(); // Refresh page on close
  };


  const [backdrop, setBackdrop] = useState("blur");

  const { theme, setTheme } = useTheme();

  const handleDownloadImage = () => {
    if (!returnUrl) {
      alert("No processed image available to view.");
      return;
    }

    try {
      const fullUrl = returnUrl.startsWith("http") ? returnUrl : `http://127.0.0.1:5000${returnUrl}`;

      // Open image in a new tab
      window.open(fullUrl, "_blank");
    } catch (error) {
      console.error("Error opening image:", error);
    }
  };



  const resetState = () => {
    setReturnUrl('');
    setGradeName('');
    setConfidenceScore(null);
  };



  const onMediaChange = (file: File) => {
    setPreviewUrl('');  // 🔥 Reset preview first
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };


  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    setImage(file);
    onMediaChange(file);
  };

  const onUploadClick = async () => {
    if (!image) {
      alert("Please select an image");
      return;
    }

    setIsLoading(true);
    resetState();  // 🔥 Clears old results before a new upload

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/predict",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setIsLoading(false);
      onOpen();
      console.log("File uploaded successfully:", response.data);
      setReturnUrl(response.data.image_url);
      setGradeName(response.data.predicted_class);
      setConfidenceScore(response.data.confidence_score);

      console.log("Return URL:", response.data.image_url);
      console.log("Grade Name:", response.data.predicted_class);
      console.log("Confidence Score:", response.data.confidence_score);
    } catch (error) {
      console.log("Error uploading file:", error);
      // Handle error
    }
  };

  return (
    <NextUIProvider>
      <main className={`flex min-h-screen flex-col items-center ${theme === 'light' ? 'text-black' : 'text-white'}`}>
        {/* Navbar */}
        <br></br>
        <br></br>
        <br></br>
        <br></br>
        {/* Main Section */}
        <div className="flex flex-col gap-10 m-5 my-11 max-w-3xl">
          <h1 className="text-5xl text-wrap font-extrabold">
            Improving Lives with Sight<span className="text-green-500">Safe</span>
          </h1>
          <h3 className="text-xl">
            Our artificial intelligence platform supports providers and payers to
            enhance clinical care and administrative efficiency. We are on the quest
            to improve oral health by creating a future that is clinically precise,
            efficient & patient-centric.
          </h3>
          <h2 className="text-xl font-semibold">Upload an <span className="text-green-500">Rectinal</span> Radiograph</h2>
          <div className="rounded-xl">
            {image ? (
              <img className="w-full rounded-xl" src={previewUrl} alt="Image Preview" />
            ) : (
              <video autoPlay muted playsInline controls={false} className="w-full rounded-xl">
                <source src={previewUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          {/* Upload Button with an icon */}
          <div className="flex justify-end px-5">
            <input
              type="file"
              id="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
            <label
              htmlFor="file"
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-xl cursor-pointer"
            >
              <FontAwesomeIcon icon={faArrowUpFromBracket} />
              <span>Upload Image</span>
            </label>
          </div>

          <div className="flex justify-end px-5">
            <button
              onClick={onUploadClick}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl"
            >
              {isLoading ? (
                <Spinner color="default" />
              ) : (
                <>
                  <FontAwesomeIcon icon={faLink} />
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>

          {/* Modal Section */}
          <Modal
            size="3xl"
            backdrop="blur"
            isOpen={isOpen}
            onClose={handleCloseModal}  // Use the custom function
            className="bg-gray-400 rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-10 border border-gray-100"
          >
            <ModalContent>
              <>
                <ModalHeader className="flex flex-col gap-1 text-white text-xl font-bold">
                  Diagnosed Radiograph
                </ModalHeader>

                {/* Centering content vertically & horizontally */}
                <ModalBody className="flex flex-col items-center justify-center">
                  {/* Image Section */}
                  <div className="w-full flex justify-center">
                    {returnUrl && (
                      <img
                        src={returnUrl}
                        alt="Processed Image"
                        className="rounded-xl w-3/4 max-w-[500px]"  // Controls size
                      />
                    )}
                  </div>

                  {/* Text Section */}
                  <div className="mt-5 text-center">
                    <p className="text-2xl font-bold text-white">{gradeName}</p>
                    <p className="text-xl font-bold text-white mt-2">
                      Probability Score: {confidenceScore !== null ? confidenceScore.toFixed(2) : "N/A"}
                    </p>
                  </div>
                </ModalBody>

                {/* Buttons */}
                <ModalFooter className="flex justify-center">
                  <Button color="danger" variant="light" onPress={handleCloseModal}>
                    Close
                  </Button>
                  {returnUrl && (
                    <Button color="primary" onPress={() => window.open(returnUrl, "_blank")}>
                      View Full Size
                    </Button>
                  )}
                </ModalFooter>
              </>
            </ModalContent>
          </Modal>


          {/* Theme Toggler */}
        </div>
      </main>
    </NextUIProvider>
  );
}

const ThemeToggler = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      aria-label="theme toggler"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="bg-gray-2 dark:bg-dark-bg absolute right-17 mr-1.5 flex cursor-pointer items-center justify-center rounded-full text-black dark:text-white lg:static"
    >
      <Image
        src={theme === "light" ? "/images/icon/icon-sun.svg" : "/images/icon/icon-moon.svg"}
        alt="theme-toggle-icon"
        width={21}
        height={21}
      />
    </button>
  );
};
