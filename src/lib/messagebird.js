/**
 * Configuration for MessageBird
 */
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
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .substring(0, 200);    // Limit length for WhatsApp
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
 * Create message payload for MessageBird API
 */
const createMessagePayload = ({
    date,
    scooterId,
    currentKm,
    nextKm,
    serviceDetails
}) => ({
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
});

/**
 * Send message using MessageBird API
 */
const sendMessage = async (messagePayload, toNumber) => {
    try {
        const response = await fetch('https://conversations.messagebird.com/v1/send', {
            method: 'POST',
            headers: {
                'Authorization': `AccessKey ${config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...messagePayload,
                to: toNumber
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.errors?.[0]?.description || 'Failed to send message');
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
        // Validate required parameters
        if (!date || !scooterId || !currentKm || !nextKm || !serviceDetails) {
            throw new Error('Missing required parameters for notification');
        }

        const messagePayload = createMessagePayload({
            date,
            scooterId,
            currentKm,
            nextKm,
            serviceDetails
        });

        // Always send to primary number
        const primarySent = await sendMessage(messagePayload, config.numbers.primary);

        // If it's a Bolt scooter, also send to Bolt number
        let boltSent = true;
        if (category?.toLowerCase().includes('bolt')) {
            boltSent = await sendMessage(messagePayload, config.numbers.bolt);
        }

        return primarySent && boltSent;
    } catch (error) {
        console.error('Error in sendServiceNotification:', error);
        return false;
    }
};

// Export for testing purposes
export const testWhatsAppIntegration = async () => {
    try {
        const testMessage = {
            date: new Date(),
            scooterId: 'TEST123',
            currentKm: 1000,
            nextKm: 2000,
            serviceDetails: 'Test service notification',
            category: 'test'
        };

        const result = await sendServiceNotification(testMessage);
        return {
            success: result,
            message: 'Test notification processed successfully'
        };
    } catch (error) {
        console.error('WhatsApp integration test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export default {
    sendServiceNotification,
    testWhatsAppIntegration
};