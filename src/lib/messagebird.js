import messagebird from 'messagebird';

// Configuration
const config = {
    apiKey: 'fd8275d6-25cf-4437-982a-23b87bf76a3d',
    channelId: '472631b5-19e3-5825-96ae-0647959b8f97',
    namespace: '1cd17d45-f759-4981-8af7-60d8f6ec8d85',
    templateName: 'LA Rentals Service Update',
    numbers: {
        from: '+15557105010',      // Business number sending messages
        primary: '+35677106319',   // Primary number - gets ALL notifications
        bolt: '+35699110797'       // Bolt number - gets only Bolt notifications
    }
};

// Initialize MessageBird client with request queue
const messagebirdClient = messagebird(config.apiKey);
const messageQueue = [];
let isProcessingQueue = false;

/**
 * Process message queue in background
 */
const processMessageQueue = async () => {
    if (isProcessingQueue || messageQueue.length === 0) return;
    
    isProcessingQueue = true;
    
    while (messageQueue.length > 0) {
        const message = messageQueue.shift();
        try {
            await messagebirdClient.conversations.send({
                ...message,
                from: config.numbers.from  // Add the from number
            });
            await new Promise(resolve => setTimeout(resolve, 100)); // Delay between messages
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }
    
    isProcessingQueue = false;
};

/**
 * Creates WhatsApp message parameters
 */
const createMessageParams = ({date, scooterId, currentKm, nextKm}) => ({
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
                    { type: 'text', text: date },
                    { type: 'text', text: scooterId },
                    { type: 'text', text: currentKm.toString() },
                    { type: 'text', text: nextKm.toString() }
                ]
            }]
        }
    }
});

/**
 * Queue a message for sending
 */
const queueMessage = (messageParams, toNumber) => {
    messageQueue.push({
        ...messageParams,
        to: toNumber
    });
    
    // Start processing queue if not already processing
    if (!isProcessingQueue) {
        setTimeout(processMessageQueue, 0);
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
    category
}) => {
    try {
        const messageParams = createMessageParams({
            date,
            scooterId,
            currentKm,
            nextKm
        });

        // Queue message to primary number (for ALL services)
        queueMessage(messageParams, config.numbers.primary);

        // If it's a Bolt scooter, queue additional notification
        if (category?.toLowerCase() === 'bolt') {
            queueMessage(messageParams, config.numbers.bolt);
        }

        return true;
    } catch (error) {
        console.error('Error in sendServiceNotification:', error);
        return false;
    }
};

// Export for testing purposes
export const __testing__ = {
    getQueueLength: () => messageQueue.length,
    clearQueue: () => messageQueue.length = 0
};