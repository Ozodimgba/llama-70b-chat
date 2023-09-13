import { client } from "@gradio/client";

const app = await client("https://ysharma-explore-llamav2-with-tgi.hf.space/");
const result = await app.predict("/chat", [		
				"Howdy!", // string  in 'Message' Textbox component
	]);

console.log(result.data);
