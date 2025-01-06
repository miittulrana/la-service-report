// Configuration
const config = {
    apiKey: 'ZtmGp69YV8Nlr5Etr6Ji9RXPtyMrIdaRnvvL',
    channelId: '472631b5-19e3-5825-96ae-0647959b8f97',
    namespace: '1cd17d45-f759-4981-8af7-60d8f6ec8d85',
    templateName: 'LA Rentals Service Update',
    numbers: {
        primary: '+35699307229',   // Primary number - gets ALL notifications
        bolt: '+35699307229'       // Bolt number - gets only Bolt notifications
    }
};

/**
 * Format service details for WhatsApp message
 */
const formatServiceDetails = (details) => {
    return details.trim()
        .replace(/\s+/g, ' ')
        .substring(0, 200);
};

/**
 * Format date for WhatsApp message
 */
const formatMessageDate = (date) => {
    try {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return date.toString();
    }
};

/**
 * Send message to MessageBird API
 */
const sendMessage = async (messageParams, toNumber) => {
    try {
        const response = await fetch('https://conversations.messagebird.com/v1/send', {
            method: 'POST',
            headers: {
                'Authorization': `AccessKey ${config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...messageParams,
                to: toNumber
            })
        });

        if (!response.ok) {
            throw new Error(`MessageBird API error: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Send message error:', error);
        return false;
    }
};

/**
 * Main function to send service notifications
 */
export const sendServiceNotification = async ({
    date,
    scooterId,
    currentKm,
    nextKm,
    serviceDetails,
    category
}) => {
    try {
        if (!date || !scooterId || !currentKm || !nextKm || !serviceDetails) {
            throw new Error('Missing required parameters');
        }

        const messageParams = {
            channelId: config.channelId,
            type: 'hsm',
            content: {
                hsm: {
                    namespace: config.namespace,
                    templateName: config.templateName,
                    language: {
                        code: 'en',
                        policy: 'deterministic'
                    },
                    components: [{
                        type: 'body',
                        parameters: [
                            { type: 'text', text: formatMessageDate(date) },
                            { type: 'text', text: scooterId },
                            { type: 'text', text: currentKm.toLocaleString() },
                            { type: 'text', text: nextKm.toLocaleString() },
                            { type: 'text', text: formatServiceDetails(serviceDetails) }
                        ]
                    }]
                }
            }
        };

        // Send to primary number
        await sendMessage(messageParams, config.numbers.primary);

        // If it's a Bolt scooter, also send to Bolt number
        if (category?.toLowerCase().includes('bolt')) {
            await sendMessage(messageParams, config.numbers.bolt);
        }

        return true;
    } catch (error) {
        console.error('Error in sendServiceNotification:', error);
        return false;
    }
};

export default {
    sendServiceNotification
};