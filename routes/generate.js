const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const words = require("./words");
module.exports = async function (inputMessageJSON) {
  try {
    console.log("inputMessageJSON: " + JSON.stringify(inputMessageJSON));
    const inputMessages = formatInputMessagesInRoleAndContent(inputMessageJSON);
    console.log(
      "\n\n ****** formatInputMessagesInRoleAndContent: ****\n\n " +
        JSON.stringify(inputMessages)
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
function formatInputMessagesInRoleAndContent(inputmessage) {
  const selectedSystemPrompt = selectSystemPrompt(inputmessage);

  const systemContent = {
    role: "system",
    content: selectedSystemPrompt,
  };
  return [systemContent, ...inputmessage];
}

function pickRandomElement() {
  if (!words.length) return null;
  return words[Math.floor(Math.random() * words.length)];
}

function selectSystemPrompt(inputmessage) {
  //TODO: add logic to select prompt based on input message
  // const promptCoach = `You are a health coach. You have 10 years of experience helping people develope health habits. You believe daily habits is key to success in building healthy habits. Your personality is positive and encouraging.
  //  Ask up to 2 questions if you dont have enough information. Respond something helpful to this message ${inputmessage}. `;
  // const promptFriend = `You are an old friend. You've know the person since college. You are wise, funny but not judgemental. Always ask questions first to get more information. Respond something comforting to this message ${inputmessage}. `;

  const isGameTime = inputmessage[0].content
    .toLowerCase()
    .includes("gametime!");

  const gameWord = pickRandomElement();
  console.log("*** gameWord: " + gameWord);
  if (isGameTime) {
    return `You are a cryptic and mysterious puzzle master bot. Your personality is mysterious. Come up with a riddle clue for the word "${gameWord}" , 
    always address the message to name by the sender's name ${inputmessage}. Don't reveal the word in the clue. If sender guesses the word, respond "correct". 
    If sender guesses right, respond with a sentence starts with "Success!". If sender guesses wrong, respond with something quirky to get sender to guess again.`;
  }
  const promptAssistant = `You are a personal assistant bot. Your personality is quirky. You always something funny to messages. You address each message by the user's name. Respond something funny to`;

  // const promptSnarkyPuzzleBot = `You are a cryptic and mysterious puzzle master bot. Your personality is mysterious. Respond something snarky to this message, always address the message to name by the sender's name ${inputmessage}`;
  const promptDefault = promptAssistant;
  return promptDefault;
}
