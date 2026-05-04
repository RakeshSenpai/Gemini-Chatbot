const promptForm = document.querySelector('.prompt-form');
const promptInput = promptForm.querySelector('.prompt-input');
const fileInput = promptForm.querySelector('#file-input');
const fileUploadWraper = promptForm.querySelector('.file-upload-wraper');
const container = document.querySelector(".container");
const chatContainer = document.querySelector(".chat-container");
const API_KEY = 'AIzaSyDO4qG14W3DPpX1chkT8utiQS1Rdd8hr_4';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`

const chatHistory = []; 
const userData = {message: "" , file: {}}


const createMsgElem = (content, ...classes) => { 
    const div = document.createElement('div')
    div.classList.add('message' , ...classes)
    div.innerHTML = content;
    return div;
}

const  scrollToBottom = () => container.scrollTo({top: container.scrollHeight, behavior : "smooth"});

const typingEffects = (text, textElement, botMsgDiv) => {
    textElement.textContent = "";
    const words = text.split();
    let wordIndex = 0;

    const typingInterval = setInterval(() => {
        if(wordIndex < words.length){
            textElement.textContent += (wordIndex === 0 ? "" : "") + words[wordIndex++];
            botMsgDiv.classList.remove("loading")
            scrollToBottom();
        }else{
             clearInterval(typingInterval)
        }
    }, 40)
}

const generateResponse = async (botMsgDiv) => {
    const textElement = botMsgDiv.querySelector(".message-text")
    chatHistory.push({
        role: "user",
        parts: [{text : userData.message}, ...(userData.file.data ? [{ inline_data: (({fileName, isImage, ...rest}) => rest)(userData.file) }] : [])]
    })
    try {
        const respons = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify({contents : chatHistory})
        });

        const data = await respons.json()
        if(!respons.ok) throw new Error(data.error.message)
            console.log(data)
        const responseText = data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g, "$1").trim()
        typingEffects(responseText, textElement, botMsgDiv)

            chatHistory.push({role: "model", parts: [{text : responseText}] })
            console.log(chatHistory)

    } catch (error) {
        console.log(error)
    }    
}

const handleFromSubmit = (e) => {
    e.preventDefault()
    const userMessage = promptInput.value.trim()
    if(!userMessage) return;

    promptInput.value = "";
    userData.message = userMessage;

    const userMsgHtml = `<p class="message-text"></p>`
    const userMsgDiv = createMsgElem(userMsgHtml, "user-message")

    userMsgDiv.querySelector('.message-text').textContent = userMessage
    chatContainer.appendChild(userMsgDiv)
     scrollToBottom()

    // Gemini avatar set time out

    setTimeout(() => {
        const botMsgHtml = `<img src="resources/gemini-chatbot-logo.svg" class="avatar"><p class="message-text">Just a sec..</p>`
        const botMsgDiv = createMsgElem(botMsgHtml, "bot-message", "loading")
        chatContainer.appendChild(botMsgDiv)
         scrollToBottom()
         generateResponse(botMsgDiv)
    }, 600);

}

fileInput.addEventListener('change' , () => {
    const file = fileInput.files[0]
    if(!file) return;

    const isImage = file.type.startsWith("image/")
    const reader = new FileReader();
    reader.readAsDataURL(file) ;

    reader.onload = (e) => {
        fileInput.value = "";

        const base64String = e.target.result.split(",")[1]
        fileUploadWraper.querySelector('.file-preview').src = e.target.result;
        fileUploadWraper.classList.add('active' , isImage ? "img-attached" : "file-attached")

        userData.file = {fileName : file.name,  data: base64String, mime_type: file.type, isImage}
    }
})

document.querySelector('#cencel-file-btn').addEventListener('click' , () => {
    fileUploadWraper.classList.remove('active', "img-attached" , "file-attached")
})

promptForm.addEventListener('submit' , handleFromSubmit);
promptForm.querySelector("#add-file-btn").addEventListener('click' , () =>  fileInput.click());