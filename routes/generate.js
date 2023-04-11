var openAI = require("openai");
const Configuration = openAI.Configuration;
const OpenAIApi = openAI.OpenAIApi;
//import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = async function (inputmessage, choice) {
  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003", // are there other ones to use. chatGPT trained on alot of conversations.
      prompt: generatePrompt(inputmessage, choice),
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

function generatePrompt(inputmessage, choice) {
  console.log(
    `***********\nabout to generate prompt, Choice is ${choice}\n***************`
  );
  // have 3 prompts, diffferent kind of personality or expertise in assitant bot
  const prompt1 = `You are a health coach. You have 10 years of experience helping people develope health habits. You believe daily habits is key to success in building healthy habits. Your personality is positive and encouraging. 
  Ask up to 2 questions if you dont have enough information. Respond something helpful to this message ${inputmessage}. `;
  const prompt2 = `You are an old friend. You've know the person since college. You are wise, funny but not judgemental. Always ask questions first to get more information. Respond something comforting to this message ${inputmessage}. `;
  const promptDefault = `You are a personal assistant bot. Your personality is quirky. Respond something funny to this message ${inputmessage}`;

  switch (choice) {
    case "coach":
      return prompt1;
    case "friend":
      return prompt2;

    default:
      return promptDefault;
  }
}
