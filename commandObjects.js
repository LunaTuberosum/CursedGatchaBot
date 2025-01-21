
function splitContent(message, seperator=" ") {
    const trimmedMessage = message.content.replace(/\s{2,}/g, ' ');

    return trimmedMessage.split(seperator);
}

module.exports = { splitContent }