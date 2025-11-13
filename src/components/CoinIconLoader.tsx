import { useState, useCallback } from "react";
import { BASE_URL } from '../config'
import api from "../lib/axios";

interface CoinIconDisplayProps {
  symbol: string;
  height: string
  width: string
}
type IconStatus =
  | "idle"
  | "loading"
  | "uploading_fallback"
  | "ready"
  | "upload_success"
  | "upload_failed"
  | "direct_load_failed";
const FALLBACK_SOURCE_URL: string =
  "https://icon.gateimg.com/images/coin_icon/64/";

// This component attempts to display the icon and calls onFallbackNeeded if it fails.
const CoinIconLoader: React.FC<CoinIconDisplayProps> = ({
  symbol, height, width
}) => {
  const [iconStatus, setIconStatus] = useState<IconStatus>("idle");

  /**
   * Core function to upload the given file object for a specific symbol.
   */
  const uploadFile = useCallback(
    async (fileToUpload: File, currentSymbol: string): Promise<boolean> => {
      setIconStatus("uploading_fallback");

      const formData = new FormData();
      // The field name 'image' must match what your API expects
      formData.append("icon", fileToUpload, fileToUpload.name);

      try {
        const maxRetries: number = 3;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const response = await api.post(
              `/api/v1/files/${currentSymbol}`,
              formData
            );

            if (response.data) {
              setIconStatus("upload_success");
              return true;
            }
          } catch (error) {
            if (attempt < maxRetries - 1) {
              const delay = Math.pow(2, attempt) * 1000;
              await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
              throw error;
            }
          }
        }
        setIconStatus("upload_failed");
        return false;
      } catch (error) {
        console.error("Final network or fetch error:", error);
        setIconStatus("upload_failed");
        return false;
      }
    },
    []
  );

  const downloadAndUploadFallback = useCallback(
    async (symbol: string): Promise<void> => {
      setIconStatus("uploading_fallback");

      try {
        // 1. Download the fallback image (ETH icon)
        const downloadResponse = await fetch(
          `${FALLBACK_SOURCE_URL}${symbol}.png`
        );

        if (!downloadResponse.ok) {
          setIconStatus("direct_load_failed");
          return;
        }

        // 2. Get the Blob data and content type
        const imageBlob: Blob = await downloadResponse.blob();
        const contentType: string =
          downloadResponse.headers.get("content-type") || "image/png";

        // Use the target symbol and the determined extension for the filename
        const fileExtension = contentType.includes("/")
          ? contentType.split("/")[1].replace("jpeg", "jpg")
          : "png";
        const fileName: string = `${symbol.toUpperCase()}.${fileExtension}`;

        // 3. Convert Blob to File object
        const downloadedFile: File = new File([imageBlob], fileName, {
          type: contentType,
        });

        // 4. Upload the downloaded file to the symbol's API endpoint
        await uploadFile(downloadedFile, symbol);
      } catch (error) {
        console.error(
          "Error during download or fallback upload process:",
          error
        );
        setIconStatus("upload_failed");
      }
    },
    [symbol, uploadFile]
  );

  

  // Use the symbol as a key to force the <img> to re-attempt loading when the symbol changes
  return (
      <img
        height={height}
        width={width}
        crossOrigin="use-credentials"
        key={symbol} // Force re-render/reload when symbol changes
        src={`${BASE_URL}/api/v1/assets/${symbol}.png`}
        alt={`${symbol}`}
        // Success handler: The icon exists on the API, so we are ready.
        onLoad={() => {
          setIconStatus("ready");
        }}
        // Failure handler: The icon is missing (404/CORS/error). Trigger the fallback.
        onError={() => {
          if (
            iconStatus !== "uploading_fallback" &&
            iconStatus !== "upload_success"
          ) {
            setIconStatus("direct_load_failed");
            downloadAndUploadFallback(symbol);
          }
        }}
      />
  );
};

export default CoinIconLoader;
