const fs = require('fs');

const file = fs.readFileSync('src/translations.ts', 'utf8');

// We'll just replace the end of each language block with the new keys.
// The blocks end with:
//     theme: "Theme"
//   },
// Or similar. Let's find the last key of each block.

let newFile = file;

const enAdditions = `
    theme: "Theme",
    deleteAccount: "Delete Account",
    profilePhoto: "Profile Photo",
    yourName: "Your Name",
    tellUsWhatYouThink: "Tell us what you think...",
    memoryMatchDesc: "Exercise your short-term memory by finding matching pairs of cards.",
    wordPuzzleDesc: "Enhance cognitive flexibility by unscrambling letters to form words.",
    resetPassword: "Reset Password",
    enterEmailToReset: "Enter your email to receive a reset link",
    level: "Level",
    score: "Score",
    recallPattern: "Recall the pattern!",
    gameOver: "Game Over",
    playAgain: "Play Again",
    close: "Close",
    memoryMatchInstructions: "Memorize the highlighted tiles. When they hide, click them in any order. The game gets harder as you progress!",
    startGame: "Start Game",
    unscrambleLetters: "Unscramble the letters to form the word",
    readyToPlay: "Ready to play?",
    wordPuzzleInstructions: "Find the hidden words by selecting the scrambled letters in the correct order. The faster you solve, the better your score!",
    timeLeft: "Time Left",
    finalScore: "Final Score",
    wordsFound: "Words Found",
    activityFor: "Activity for",
    totalTime: "Total time:"`;

const hiAdditions = `
    theme: "थीम",
    deleteAccount: "खाता हटाएं",
    profilePhoto: "प्रोफ़ाइल फ़ोटो",
    yourName: "आपका नाम",
    tellUsWhatYouThink: "हमें बताएं कि आप क्या सोचते हैं...",
    memoryMatchDesc: "कार्ड के मिलान जोड़े ढूंढकर अपनी अल्पकालिक स्मृति का अभ्यास करें।",
    wordPuzzleDesc: "शब्द बनाने के लिए अक्षरों को सुलझाकर संज्ञानात्मक लचीलापन बढ़ाएं।",
    resetPassword: "पासवर्ड रीसेट करें",
    enterEmailToReset: "रीसेट लिंक प्राप्त करने के लिए अपना ईमेल दर्ज करें",
    level: "स्तर",
    score: "स्कोर",
    recallPattern: "पैटर्न याद करें!",
    gameOver: "खेल खत्म",
    playAgain: "फिर से खेलें",
    close: "बंद करें",
    memoryMatchInstructions: "हाइलाइट किए गए टाइल्स को याद रखें। जब वे छिप जाएं, तो उन्हें किसी भी क्रम में क्लिक करें। जैसे-जैसे आप आगे बढ़ते हैं खेल कठिन होता जाता है!",
    startGame: "खेल शुरू करें",
    unscrambleLetters: "शब्द बनाने के लिए अक्षरों को सुलझाएं",
    readyToPlay: "क्या आप खेलने के लिए तैयार हैं?",
    wordPuzzleInstructions: "सही क्रम में उलझे हुए अक्षरों का चयन करके छिपे हुए शब्दों को खोजें। आप जितनी जल्दी हल करेंगे, आपका स्कोर उतना ही बेहतर होगा!",
    timeLeft: "बचा हुआ समय",
    finalScore: "अंतिम स्कोर",
    wordsFound: "मिले शब्द",
    activityFor: "के लिए गतिविधि",
    totalTime: "कुल समय:"`;

const orAdditions = `
    theme: "ଥିମ୍",
    deleteAccount: "ଆକାଉଣ୍ଟ୍ ବିଲୋପ କରନ୍ତୁ",
    profilePhoto: "ପ୍ରୋଫାଇଲ୍ ଫଟୋ",
    yourName: "ଆପଣଙ୍କ ନାମ",
    tellUsWhatYouThink: "ଆପଣ କ'ଣ ଭାବୁଛନ୍ତି ଆମକୁ ଜଣାନ୍ତୁ...",
    memoryMatchDesc: "ମେଳ ଖାଉଥିବା କାର୍ଡ ଯୋଡି ଖୋଜି ଆପଣଙ୍କର ସ୍ୱଳ୍ପକାଳୀନ ସ୍ମୃତିର ଅଭ୍ୟାସ କରନ୍ତୁ।",
    wordPuzzleDesc: "ଶବ୍ଦ ଗଠନ କରିବା ପାଇଁ ଅକ୍ଷରଗୁଡ଼ିକୁ ସଜାଡି ଜ୍ଞାନାତ୍ମକ ନମନୀୟତା ବଢାନ୍ତୁ।",
    resetPassword: "ପାସୱାର୍ଡ ରିସେଟ୍ କରନ୍ତୁ",
    enterEmailToReset: "ରିସେଟ୍ ଲିଙ୍କ୍ ପାଇବା ପାଇଁ ଆପଣଙ୍କର ଇମେଲ୍ ପ୍ରବେଶ କରନ୍ତୁ",
    level: "ସ୍ତର",
    score: "ସ୍କୋର୍",
    recallPattern: "ପ୍ୟାଟର୍ଣ୍ଣ ମନେ ପକାନ୍ତୁ!",
    gameOver: "ଖେଳ ଶେଷ",
    playAgain: "ପୁଣି ଖେଳନ୍ତୁ",
    close: "ବନ୍ଦ କରନ୍ତୁ",
    memoryMatchInstructions: "ହାଇଲାଇଟ୍ ହୋଇଥିବା ଟାଇଲ୍ ଗୁଡ଼ିକୁ ମନେରଖନ୍ତୁ। ଯେତେବେଳେ ସେଗୁଡ଼ିକ ଲୁଚିଯାଏ, ସେଗୁଡ଼ିକୁ ଯେକୌଣସି କ୍ରମରେ କ୍ଲିକ୍ କରନ୍ତୁ। ଆପଣ ଆଗକୁ ବଢିବା ସହିତ ଖେଳ କଷ୍ଟକର ହୋଇଯାଏ!",
    startGame: "ଖେଳ ଆରମ୍ଭ କରନ୍ତୁ",
    unscrambleLetters: "ଶବ୍ଦ ଗଠନ କରିବା ପାଇଁ ଅକ୍ଷରଗୁଡ଼ିକୁ ସଜାଡନ୍ତୁ",
    readyToPlay: "ଖେଳିବାକୁ ପ୍ରସ୍ତୁତ କି?",
    wordPuzzleInstructions: "ସଠିକ୍ କ୍ରମରେ ଅକ୍ଷରଗୁଡ଼ିକୁ ବାଛି ଲୁଚି ରହିଥିବା ଶବ୍ଦଗୁଡ଼ିକୁ ଖୋଜନ୍ତୁ। ଆପଣ ଯେତେ ଶୀଘ୍ର ସମାଧାନ କରିବେ, ଆପଣଙ୍କ ସ୍କୋର୍ ସେତେ ଭଲ ହେବ!",
    timeLeft: "ବଳକା ସମୟ",
    finalScore: "ଚୂଡ଼ାନ୍ତ ସ୍କୋର୍",
    wordsFound: "ମିଳିଥିବା ଶବ୍ଦଗୁଡ଼ିକ",
    activityFor: "ପାଇଁ କାର୍ଯ୍ୟକଳାପ",
    totalTime: "ମୋଟ ସମୟ:"`;

const bnAdditions = `
    theme: "থিম",
    deleteAccount: "অ্যাকাউন্ট মুছুন",
    profilePhoto: "প্রোফাইল ছবি",
    yourName: "আপনার নাম",
    tellUsWhatYouThink: "আপনি কি ভাবছেন আমাদের জানান...",
    memoryMatchDesc: "মিলে যাওয়া কার্ডের জোড়া খুঁজে আপনার স্বল্পমেয়াদী স্মৃতির অনুশীলন করুন।",
    wordPuzzleDesc: "শব্দ তৈরি করতে অক্ষরগুলি সাজিয়ে জ্ঞানীয় নমনীয়তা বাড়ান।",
    resetPassword: "পাসওয়ার্ড রিসেট করুন",
    enterEmailToReset: "রিসেট লিঙ্ক পেতে আপনার ইমেল লিখুন",
    level: "স্তর",
    score: "স্কোর",
    recallPattern: "প্যাটার্ন মনে করুন!",
    gameOver: "খেলা শেষ",
    playAgain: "আবার খেলুন",
    close: "বন্ধ করুন",
    memoryMatchInstructions: "হাইলাইট করা টাইলস মনে রাখুন। যখন তারা লুকিয়ে যায়, যে কোনো ক্রমে তাদের ক্লিক করুন। আপনি যত এগিয়ে যাবেন খেলা তত কঠিন হবে!",
    startGame: "খেলা শুরু করুন",
    unscrambleLetters: "শব্দ তৈরি করতে অক্ষরগুলি সাজান",
    readyToPlay: "খেলতে প্রস্তুত?",
    wordPuzzleInstructions: "সঠিক ক্রমে অক্ষরগুলি নির্বাচন করে লুকানো শব্দগুলি খুঁজুন। আপনি যত দ্রুত সমাধান করবেন, আপনার স্কোর তত ভালো হবে!",
    timeLeft: "বাকি সময়",
    finalScore: "চূড়ান্ত স্কোর",
    wordsFound: "পাওয়া শব্দ",
    activityFor: "এর জন্য কার্যকলাপ",
    totalTime: "মোট সময়:"`;

newFile = newFile.replace(/theme:\s*"Theme"/, enAdditions);
newFile = newFile.replace(/theme:\s*"थीम"/, hiAdditions);
newFile = newFile.replace(/theme:\s*"ଥିମ୍"/, orAdditions);
newFile = newFile.replace(/theme:\s*"থিম"/, bnAdditions);

fs.writeFileSync('src/translations.ts', newFile);
console.log('Translations updated successfully.');
