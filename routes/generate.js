const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = async function (inputMessageJSON, gameWord = "") {
  try {
    console.log("inputMessageJSON: " + JSON.stringify(inputMessageJSON));
    const inputMessages = formatInputMessagesInRoleAndContent(
      inputMessageJSON,
      gameWord
    );
    console.log(
      "\n\n ****** formatInputMessagesInRoleAndContent: ****\n\n " +
        JSON.stringify(inputMessages) +
        "\n\n GameWord:\n" +
        gameWord
    );
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: inputMessages,
    });
    console.log(
      "\n******* completion.data.choices[0].message.content *****\n" +
        completion.data.choices[0].message.content
    );
    return completion.data.choices[0].message.content;
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      return error.response.data;
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      return "oh nooo an error occured :( ";
    }
  }
};

//TODO: format this into format with role and content
function formatInputMessagesInRoleAndContent(inputmessage, gameWord = "") {
  const selectedSystemPrompt = selectSystemPrompt(inputmessage, gameWord);

  const systemContent = {
    role: "system",
    content: selectedSystemPrompt,
  };
  return [systemContent, ...inputmessage];
}

function selectSystemPrompt(inputmessage, gameWord = "") {
  if (gameWord.length > 0) {
    return `You are a cryptic and mysterious puzzle master bot. Your personality is mysterious. Come up with a riddle clue for the word "${gameWord}" , 
    always address the message to name by the sender's name ${inputmessage}. Don't reveal the word in the clue. If sender guesses the word, respond "correct". 
    If sender guesses right, respond with a sentence starts with "Success!". If sender guesses wrong, respond with something quirky to get sender to guess again.`;
  }
  const promptAssistant = `You are a personal assistant bot. Your personality is quirky. You always something funny to messages. You address each message by the user's name. Respond something funny to`;

  // const promptSnarkyPuzzleBot = `You are a cryptic and mysterious puzzle master bot. Your personality is mysterious. Respond something snarky to this message, always address the message to name by the sender's name ${inputmessage}`;
  const promptDefault = promptAssistant;
  return promptDefault;
}
