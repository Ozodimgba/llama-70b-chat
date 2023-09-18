import Replicate from "replicate";
import { ReplicateStream, StreamingTextResponse } from "ai";
import { NowRequest, NowResponse } from "@vercel/node";

const REPLICATE_API_TOKEN: string | undefined = process.env.REPLICATE_API_TOKEN;

if (REPLICATE_API_TOKEN === undefined || REPLICATE_API_TOKEN === null) {
    throw new Error(
      "The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
    );
  }

export const runtime: string = "edge";

export default async function POST(req: NowRequest, res: NowResponse): Promise<void> {
  const {
    prompt,
    systemPrompt,
    maxTokens,
    temperature,
    topP,
    version,
  } = await req.body;

  const replicate = new Replicate({
    auth: "r8_PNX93eYzksixVakFnhIt7XFa58ZSJUY3oRIpC",
  });

  try {
    const response = await replicate.predictions.create({
      // IMPORTANT! You must enable streaming.
      stream: true,
      input: {
        prompt: `${prompt}`,
        system_prompt: systemPrompt,
        max_new_tokens: maxTokens,
        temperature: temperature,
        repetition_penalty: 1,
        top_p: topP,
      },
      // IMPORTANT! The model must support streaming. See https://replicate.com/docs/streaming
      version: version,
    });

    // Convert the response into a friendly text-stream
    const stream = await ReplicateStream(response);
    
    // Respond with the stream
    await new StreamingTextResponse(stream);
    res.status(200).send("Stream ended.");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing the request.");
  }
}

