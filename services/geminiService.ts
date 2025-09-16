/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { WardrobeItem } from "../types.ts";

// --- SDK Initialization with Error Handling (Lazy Initialization) ---
let ai: GoogleGenAI | null = null;
let initializationError: Error | null = null;

/**
 * A helper function to initialize the AI client on first use.
 * This lazy initialization prevents the app from crashing on load if the API key is missing.
 * Throws a detailed error if initialization fails.
 */
const getInitializedAI = (): GoogleGenAI => {
    // If it's already initialized successfully, return it.
    if (ai) {
        return ai;
    }
    // If we already tried to initialize and it failed, throw the stored error
    // to avoid re-running the failing logic.
    if (initializationError) {
        throw new Error(`AI Service initialization failed: ${initializationError.message}`);
    }

    try {
        // This code assumes `process.env.API_KEY` is available in the browser context.
        // In a build-less setup, this requires manual injection or a specific hosting feature.
        // In services/geminiService.ts
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY environment variable not found. Please configure it in your deployment settings.");
}
ai = new GoogleGenAI({ apiKey: apiKey });
        return ai;
    } catch (e) {
        initializationError = e instanceof Error ? e : new Error(String(e));
        console.error("Fatal Error: GoogleGenAI failed to initialize.", initializationError);
        throw new Error(`AI Service initialization failed: ${initializationError.message}`);
    }
};


// --- Helper Functions ---

const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
};

const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

const handleApiResponse = (response: GenerateContentResponse): string => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        throw new Error(errorMessage);
    }

    // Find the first image part in any candidate
    for (const candidate of response.candidates ?? []) {
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const { mimeType, data } = imagePart.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        throw new Error(errorMessage);
    }
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image. ` + (textFeedback ? `The model responded with text: "${textFeedback}"` : "This can happen due to safety filters or if the request is too complex. Please try a different image.");
    throw new Error(errorMessage);
};

const model = 'gemini-2.5-flash-image-preview';

// --- API Functions ---

export const generateModelImage = async (userImage: File): Promise<string> => {
    const ai = getInitializedAI();
    const userImagePart = await fileToPart(userImage);
    const prompt = `You are an expert fashion photographer AI. Your task is to transform the person in the provided image into a full-body fashion model photo suitable for an e-commerce website. Follow these rules precisely:

**1. Centering:** The person MUST be perfectly centered within the frame of the final image.
**2. Background Preservation:** The background from the original image MUST be preserved perfectly.
**3. Model Transformation:** The person should have a neutral, professional model expression and be placed in a standard, relaxed standing model pose.
**4. Identity Preservation:** Preserve the person's identity, unique facial features, and body type.
**5. Photorealism:** The final image must be photorealistic.
**6. Output:** Return ONLY the final image file. Do not include any text, descriptions, or commentary.`;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [userImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File, garmentInfo: WardrobeItem): Promise<string> => {
    const ai = getInitializedAI();
    const modelImagePart = dataUrlToPart(modelImageUrl);
    const garmentImagePart = await fileToPart(garmentImage);
    
    let prompt;
    if (garmentInfo.category === 'accessory') {
        prompt = `You are an expert virtual try-on AI. You will be given a 'model image' and an 'accessory image' (${garmentInfo.name}). Your task is to create a new photorealistic image where the person from the 'model image' is wearing or holding the accessory from the 'accessory image'.

**Crucial Rules:**
1.  **Realistically ADD the Accessory:** Place the accessory naturally on the person. Do not replace their existing clothing unless necessary for placement (e.g., placing sunglasses on the face).
2.  **Preserve the Model & Clothing:** The person's face, hair, body shape, pose, and existing clothing from the 'model image' MUST remain unchanged as much as possible.
3.  **Preserve the Background:** The entire background from the 'model image' MUST be preserved perfectly.
4.  **Lighting and Shadows:** Ensure the added accessory has lighting and shadows consistent with the original scene.
5.  **Output:** Return ONLY the final, edited image. Do not include any text.`;
    } else { // Default to 'top' or other clothing
        prompt = `You are an expert virtual try-on AI. You will be given a 'model image' and a 'garment image'. Your task is to create a new photorealistic image where the person from the 'model image' is wearing the clothing from the 'garment image'.

**Crucial Rules:**
1.  **Analyze the Garment Image:** The 'garment image' may show the clothing item on a person, on a mannequin, or flat. Your first step is to identify the primary clothing item in the 'garment image' and intelligently separate it from its original background or model.
2.  **Complete Garment Replacement:** You MUST completely REMOVE and REPLACE the corresponding clothing item worn by the person in the 'model image' with the new garment from the 'garment image'. No part of the original clothing (e.g., collars, sleeves, patterns) should be visible in the final image.
3.  **Preserve the Model:** The person's face, hair, body shape, and pose from the 'model image' MUST remain unchanged.
4.  **Preserve the Background:** The entire background from the 'model image' MUST be preserved perfectly.
5.  **Apply the Garment:** Realistically fit the new garment onto the person. It should adapt to their pose with natural folds, shadows, and lighting consistent with the original scene.
6.  **Output:** Return ONLY the final, edited image. Do not include any text.`;
    }

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    const ai = getInitializedAI();
    const tryOnImagePart = dataUrlToPart(tryOnImageUrl);
    const prompt = `You are an expert fashion photographer AI. Take this image and regenerate it from a different perspective. The person, clothing, and background style must remain identical. The new perspective should be: "${poseInstruction}". Return ONLY the final image.`;
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [tryOnImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const changeGarmentColor = async (imageUrl: string, newColor: string): Promise<string> => {
    const ai = getInitializedAI();
    const imagePart = dataUrlToPart(imageUrl);
    const prompt = `You are an expert fashion photo editor. Change the color of the main clothing item the person is wearing to ${newColor}. The texture and material of the clothing should be preserved. The person, their pose, all other clothing items/accessories, and the background must remain perfectly identical. Only alter the color of the specified garment. Return ONLY the final, edited image.`;
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const changeBackground = async (imageUrl: string, backgroundPrompt: string): Promise<string> => {
    const ai = getInitializedAI();
    const imagePart = dataUrlToPart(imageUrl);
    const prompt = `You are an expert photo editor. Replace the background of this image with a new one described as: "${backgroundPrompt}". The person and their clothing/accessories must remain completely unchanged and perfectly preserved. The lighting and shadows on the person should be realistically adjusted to match the new background environment. Return ONLY the final, edited image.`;
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const changeLighting = async (imageUrl: string, lightingPrompt: string): Promise<string> => {
    const ai = getInitializedAI();
    const imagePart = dataUrlToPart(imageUrl);
    const prompt = `You are an expert lighting director AI. Relight this image to match the following style: "${lightingPrompt}". Adjust shadows and highlights realistically. The person, their clothing, and the background must remain perfectly identical. Only alter the lighting. Return ONLY the final, edited image.`;
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const generateLookbook = async (imageUrls: string[], templatePrompt: string): Promise<string> => {
    const ai = getInitializedAI();
    const imageParts = imageUrls.map(url => dataUrlToPart(url));
    const prompt = `You are a professional graphic designer for a high-end fashion magazine. You will be given several images of a fashion model in different outfits. Your task is to arrange these images into a single, stylish, and visually appealing lookbook page.
    **Layout Style:** ${templatePrompt}
    Ensure the final composition looks like a page from a premium fashion catalog. Return ONLY the final, single lookbook image.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [...imageParts, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const magicWandEdit = async (imageUrl: string, instruction: string): Promise<string> => {
    const ai = getInitializedAI();
    const imagePart = dataUrlToPart(imageUrl);
    const prompt = `You are an expert fashion photo editor AI. You will be given an image and an instruction to edit the main garment the person is wearing.
**Instruction:** "${instruction}".

**Crucial Rules:**
1.  **Apply the Edit:** Precisely apply the requested edit to the primary clothing item.
2.  **Preserve Everything Else:** The person's face, body, pose, the background, and any other clothing or accessories MUST remain perfectly identical.
3.  **Output:** Return ONLY the final, edited image. Do not add any text.`;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};
