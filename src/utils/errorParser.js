/**
 * Formats API errors (including Pydantic validation error lists) into a human-readable string.
 */
export const parseApiError = (data, fallbackMessage = 'An error occurred') => {
    if (data && data.detail) {
        if (Array.isArray(data.detail)) {
            return data.detail.map(err => {
                let msg = err.msg || '';
                // Strip "Value error, " prefix often added by Pydantic validators
                if (msg.startsWith('Value error, ')) {
                    msg = msg.replace('Value error, ', '');
                }
                return msg;
            }).join(', ');
        } else if (typeof data.detail === 'string') {
            return data.detail;
        }
    }
    return fallbackMessage;
};
