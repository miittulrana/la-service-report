import messagebird from 'messagebird';

// Configuration
const config = {
    apiKey: 'ZtmGp69YV8Nlr5Etr6Ji9RXPtyMrIdaRnvvL',
    channelId: 'f452b037-09c6-5838-9f3f-d8fd5342cae7',
    namespace: '1cd17d45-f759-4981-8af7-60d8f6ec8d85',
    templateName: 'LA Rentals Service Update',
    numbers: {
        primary: '+35677106319',   // Primary number - gets ALL notifications
        bolt: '+35699110797'       // Bolt number - gets only Bolt notifications
    }
};

// Initialize MessageBird client
const messagebirdClient = messagebird(config.apiKey);

// Message queue for rate limiting
const messageQueue = [];
let isProcessingQueue = false;

/**
 * Process message queue with rate limiting
 */
const processMessageQueue = async () => {
    if (isProcessingQueue || messageQueue.length === 0) return;

    isProcessingQueue = true;

    try {
        while (messageQueue.length > 0) {
            const message = messageQueue.shift();
            try {
                await messagebirdClient.conversations.send(message);
                // Rate limiting: Wait 100ms between messages
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error('Failed to send message:', error);
                // Log specific error details
                if (error.errors) {
                    error.errors.forEach(e => console.error('MessageBird error:', e));
                }
            }
        }
    } catch (error) {
        console.error('Queue processing error:', error);
    } finally {
        isProcessingQueue = false;
    }
};

/**
 * Format service details for WhatsApp message
 */
const formatServiceDetails = (details) => {
    // Trim and clean up service details
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
 * Create WhatsApp message parameters
 */
const createMessageParams = ({
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
 * Queue a message for sending with error handling
 */
const queueMessage = (messageParams, toNumber) => {
    try {
        messageQueue.push({
            ...messageParams,
            to: toNumber
        });

        // Start processing queue if not already processing
        if (!isProcessingQueue) {
            setTimeout(processMessageQueue, 0);
        }
    } catch (error) {
        console.error('Error queueing message:', error);
    }
};

/**
 * Main function to send service notifications
 * @param {Object} params Service notification parameters
 * @returns {Promise<boolean>} Success status
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

        const messageParams = createMessageParams({
            date,
            scooterId,
            currentKm,
            nextKm,
            serviceDetails
        });

        // Always send to primary number
        queueMessage(messageParams, config.numbers.primary);

        // If it's a Bolt scooter, also send to Bolt number
        if (category?.toLowerCase().includes('bolt')) {
            queueMessage(messageParams, config.numbers.bolt);
        }

        return true;
    } catch (error) {
        console.error('Error in sendServiceNotification:', error);
        return false;
    }
};

// Test function to verify WhatsApp integration
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
            queueLength: messageQueue.length
        };
    } catch (error) {
        console.error('WhatsApp integration test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Export queue management functions for testing
export const queueManagement = {
    getQueueLength: () => messageQueue.length,
    clearQueue: () => {
        messageQueue.length = 0;
        isProcessingQueue = false;
    },
    getQueueStatus: () => ({
        queueLength: messageQueue.length,
        isProcessing: isProcessingQueue
    })
};

export default {
    sendServiceNotification,
    testWhatsAppIntegration,
    queueManagement
};