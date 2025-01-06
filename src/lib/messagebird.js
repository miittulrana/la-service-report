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
    if (!details) return '';
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
        return date?.toString() || '';
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
                    { type: 'text', text: currentKm?.toLocaleString() || '0' },
                    { type: 'text', text: nextKm?.toLocaleString() || '0' },
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

        return {
            success: true,
            error: null
        };
    } catch (error) {
        console.error('Send message error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Send message to primary number
 */
export const sendToPrimaryNumber = async (serviceData) => {
    if (!serviceData || !config.numbers.primary) {
        return { success: false, error: 'Invalid service data or primary number' };
    }
    const messagePayload = createMessagePayload(serviceData);
    return sendMessage(messagePayload, config.numbers.primary);
};

/**
 * Send message to Bolt number
 */
export const sendToBoltNumber = async (serviceData) => {
    if (!serviceData || !config.numbers.bolt) {
        return { success: false, error: 'Invalid service data or bolt number' };
    }
    const messagePayload = createMessagePayload(serviceData);
    return sendMessage(messagePayload, config.numbers.bolt);
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

        const serviceData = {
            date,
            scooterId,
            currentKm,
            nextKm,
            serviceDetails
        };

        // Send to primary number
        const primaryResult = await sendToPrimaryNumber(serviceData);

        // For Bolt category, also send to Bolt number
        let boltResult = { success: true };
        if (category?.toLowerCase().includes('bolt')) {
            boltResult = await sendToBoltNumber(serviceData);
        }

        return {
            success: primaryResult.success && boltResult.success,
            primaryResult,
            boltResult,
            error: primaryResult.error || boltResult.error
        };
    } catch (error) {
        console.error('Error in sendServiceNotification:', error);
        return {
            success: false,
            primaryResult: { success: false },
            boltResult: { success: false },
            error: error.message
        };
    }
};

/**
 * Resend notification for specific service
 */
export const resendServiceNotification = async (serviceData, numberType = 'primary') => {
    try {
        // Validate service data
        if (!serviceData?.date || !serviceData?.scooterId) {
            throw new Error('Invalid service data for resend');
        }

        if (numberType === 'bolt') {
            return await sendToBoltNumber(serviceData);
        }
        return await sendToPrimaryNumber(serviceData);
    } catch (error) {
        console.error('Error resending notification:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export default {
    sendServiceNotification,
    resendServiceNotification,
    sendToPrimaryNumber,
    sendToBoltNumber,
    config
};