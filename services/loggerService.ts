
class LoggerService {
    info(message: string, data?: any) {
        this.log('info', message, data);
    }

    warn(message: string, data?: any) {
        this.log('warn', message, data);
    }

    error(message: string, data?: any) {
        this.log('error', message, data);
    }

    debug(message: string, data?: any) {
        this.log('debug', message, data);
    }

    private log(level: string, message: string, data?: any) {
        // Always log to console for Web debugging
        const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
        consoleMethod(`[${level.toUpperCase()}] ${message}`, data || '');

        // Bridge to backend if in Electron
        if (window.electronAPI) {
            window.electronAPI.logMessage(level, message, data);
        }
    }

    async getLogFilePath(): Promise<string | null> {
        if (window.electronAPI) {
            return await window.electronAPI.getLogPath();
        }
        return null;
    }
}

export const Logger = new LoggerService();
