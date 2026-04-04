import { SYNCSPACE_RENDER_PROMPT } from "./constants";
import puter from "@heyputer/puter.js";

export async function fetchasdataurl(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch image: ${response.status} ${response.statusText}`,
        );
    }

    const blob = await response.blob();

    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () =>
            reject(reader.error ?? new Error("Failed to read blob"));

        reader.readAsDataURL(blob);
    });
}

export const generate3DView = async ({
    sourceImage,
}: Generate3DViewParams) => {
    const dataurl = sourceImage.startsWith("data:")
        ? sourceImage
        : await fetchasdataurl(sourceImage);

    const base64Data = dataurl.split(",")[1];
    const mimeType = dataurl.split(";")[0].split(":")[1];

    if (!mimeType || !base64Data) {
        throw new Error("Invalid source image payload");
    }

    const response = await puter.ai.txt2img({
        prompt: SYNCSPACE_RENDER_PROMPT,
        provider: "gemini",
        model: "gemini-2.5-flash-image-preview",
        input_image: base64Data,
        input_image_mime_type: mimeType,
        ratio: { w: 1024, h: 1024 },
    });

    const rawImageUrl = (response as HTMLImageElement).src ?? null;

    if (!rawImageUrl) {
        return { renderedImage: null, renderedPath: undefined };
    }

    const renderedImage = rawImageUrl.startsWith("data:")
        ? rawImageUrl
        : await fetchasdataurl(rawImageUrl);

    return { renderedImage, renderedPath: undefined };
};
