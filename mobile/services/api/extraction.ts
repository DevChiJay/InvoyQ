import { apiClient } from "./client";
import type { ExtractionInput, ExtractionResponse } from "@/types/extraction";

// Vision calls can take up to 60s on the server, so the default client timeout is too short.
const EXTRACTION_TIMEOUT_MS = 90_000;

export const extractionApi = {
  extract: async (input: ExtractionInput): Promise<ExtractionResponse> => {
    const form = new FormData();
    const text = input.text?.trim();
    if (text) form.append("text", text);
    if (input.imageUri) {
      // React Native's FormData takes a { uri, name, type } descriptor for files.
      form.append("file", {
        uri: input.imageUri,
        name: input.imageName ?? "screenshot.jpg",
        type: input.imageMimeType ?? "image/jpeg",
      } as unknown as Blob);
    }

    const response = await apiClient.post<ExtractionResponse>(
      "/extract-job-details",
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: EXTRACTION_TIMEOUT_MS,
      },
    );
    return response.data;
  },
};
