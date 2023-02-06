var openAI = require("openai");
const Configuration = openAI.Configuration;
const OpenAIApi = openAI.OpenAIApi;
//import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = async function (inputmessage) {
  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: generatePrompt(inputmessage, "sassy"),
      temperature: 0.6,
      max_tokens: 1000,
    });
    console.log(completion.data);
    return completion.data.choices[0].text;
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      //res.status(error.response.status).json(error.response.data);
      return error.response.data;
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      return "oh nooo an error occured :( ";
      // res.status(500).json({
      //   error: {
      //     message: 'An error occurred during your request.',
      //   }
      // });
    }
  }
};

function generatePrompt(inputmessage, personality) {
  const prompt = `You are chat bot. Your personality is ${personality}. Respond something funny to this message ${inputmessage}`;
  return prompt;
}