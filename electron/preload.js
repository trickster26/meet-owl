import { contextBridge, ipcRenderer } from 'electron';
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // ----- Config -----
    getConfig: function () { return ipcRenderer.invoke('get-config'); },
    setApiKey: function (apiKey) { return ipcRenderer.invoke('set-api-key', apiKey); },
    setAIMode: function (mode) { return ipcRenderer.invoke('set-ai-mode', mode); },
    // ----- Audio Sources -----
    getAudioSources: function () { return ipcRenderer.invoke('get-audio-sources'); },
    // ----- Recording -----
    startRecording: function () { return ipcRenderer.invoke('start-recording'); },
    stopRecording: function () { return ipcRenderer.invoke('stop-recording'); },
    getRecordingStatus: function () { return ipcRenderer.invoke('get-recording-status'); },
    saveRecording: function (buffer, filename) {
        return ipcRenderer.invoke('save-recording', buffer, filename);
    },
    getRecordings: function () { return ipcRenderer.invoke('get-recordings'); },
    // ----- Transcription -----
    transcribeAudio: function (audioPath, options) {
        return ipcRenderer.invoke('transcribe-audio', audioPath, options);
    },
    checkWhisper: function () { return ipcRenderer.invoke('check-whisper'); },
    saveTranscript: function (transcript, filename) {
        return ipcRenderer.invoke('save-transcript', transcript, filename);
    },
    getTranscripts: function () { return ipcRenderer.invoke('get-transcripts'); },
    // ----- Summarization -----
    summarizeTranscript: function (transcript) {
        return ipcRenderer.invoke('summarize-transcript', transcript);
    },
    checkOllama: function () { return ipcRenderer.invoke('check-ollama'); },
    setOllamaModel: function (model) { return ipcRenderer.invoke('set-ollama-model', model); },
    // ----- Database -----
    createMeeting: function (meeting) { return ipcRenderer.invoke('create-meeting', meeting); },
    getMeetings: function () { return ipcRenderer.invoke('get-meetings'); },
    getMeetingDetails: function (id) { return ipcRenderer.invoke('get-meeting-details', id); },
    updateMeeting: function (id, updates) { return ipcRenderer.invoke('update-meeting', id, updates); },
    deleteMeeting: function (id) { return ipcRenderer.invoke('delete-meeting', id); },
    saveMeetingTranscript: function (meetingId, transcript) {
        return ipcRenderer.invoke('save-meeting-transcript', meetingId, transcript);
    },
    saveMeetingSummary: function (meetingId, summary, model) {
        return ipcRenderer.invoke('save-meeting-summary', meetingId, summary, model);
    },
    searchMeetings: function (query) { return ipcRenderer.invoke('search-meetings', query); },
    // ----- App Info -----
    getAppPaths: function () { return ipcRenderer.invoke('get-app-paths'); },
    getPlatformInfo: function () { return ipcRenderer.invoke('get-platform-info'); },
    getSystemStatus: function () { return ipcRenderer.invoke('get-system-status'); },
    getPricingInfo: function () { return ipcRenderer.invoke('get-pricing-info'); },
    // ----- Permissions -----
    checkMicrophonePermission: function () { return ipcRenderer.invoke('check-microphone-permission'); },
    checkScreenPermission: function () { return ipcRenderer.invoke('check-screen-permission'); },
});
