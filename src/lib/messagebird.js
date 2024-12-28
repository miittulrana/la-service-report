import messagebird from 'messagebird';

// Configuration - Replace these with your actual values after approval
const config = {
    apiKey: 'YOUR_API_KEY',
    channelId: 'YOUR_CHANNEL_ID',
    namespace: 'YOUR_NAMESPACE',
    templateName: 'service_update',
    numbers: {
        primary: '+35677106319',   // Primary number - gets ALL notifications
        bolt: '+35699110797'       // Bolt number - gets only Bolt notifications
    }
};

// Initialize MessageBird client
const messagebirdClient = messagebird(config.apiKey);

/**
 * Creates WhatsApp message parameters with template variables
 */
const createWhatsAppMessage = ({date, scooterId, currentKm, nextKm}) => ({
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
 * Sends a single WhatsApp message
 */
const sendMessage = async (messageParams, toNumber) => {
    try {
        await messagebirdClient.conversations.send({
            ...messageParams,
            to: toNumber
        });
        return true;
    } catch (error) {
        console.error(`Failed to send WhatsApp message to ${toNumber}:`, error);
        return false;
    }
};

/**
 * Main function to send service notifications
 * @param {Object} params
 * @param {string} params.date - Service date
 * @param {string} params.scooterId - Scooter ID
 * @param {number} params.currentKm - Current kilometer reading
 * @param {number} params.nextKm - Next service kilometer reading
 * @param {string} params.category - Category name ('Bolt', 'Regular', etc)
 * @returns {Promise<boolean>} Success status
 */
export const sendServiceNotification = async ({
    date,
    scooterId,
    currentKm,
    nextKm,
    category
}) => {
    try {
        const messageParams = createWhatsAppMessage({
            date,
            scooterId,
            currentKm,
            nextKm
        });

        // Always send to primary number for ALL services
        await sendMessage(messageParams, config.numbers.primary);

        // If it's a Bolt scooter, send additional notification to Bolt number
        if (category?.toLowerCase() === 'bolt') {
            await sendMessage(messageParams, config.numbers.bolt);
        }

        console.log('Service notification sent successfully');
        return true;

    } catch (error) {
        console.error('Error in sendServiceNotification:', error);
        return false;
    }
};

// Example usage in your handleAddService:
/*
import { sendServiceNotification } from '../lib/messagebird';

const handleAddService = async (e) => {
    e.preventDefault();
    try {
        // Your existing service addition code...

        // Send WhatsApp notification
        await sendServiceNotification({
            date: newService.service_date,
            scooterId: scooter.id,
            currentKm: parseInt(newService.current_km),
            nextKm: nextServiceKm,
            category: scooter.category?.name
        });

    } catch (error) {
        console.error('Error:', error);
        alert('Error adding service');
    }
};
*/