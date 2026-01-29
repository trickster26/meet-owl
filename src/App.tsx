import { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import { browserWhisperService, TranscriptionProgress } from './services/browserWhisper';
import { browserSummaryService } from './services/browserSummary';
import {
    Mic,
    Square,
    Pause,
    Play,
    Clock,
    FileText,
    History,
    Settings,
    Trash2,
    Eye,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Target,
    ListChecks,
    GitBranch,
    Volume2,
    WifiOff,
    Shield,
    Zap,
    ChevronRight,
    Monitor,
} from 'lucide-react';

interface Meeting {
    id: number;
    title: string;
    date: string;
    duration: number;
    audioPath: string;
    status: string;
    createdAt: string;
}

interface TranscriptSegment {
    id: number;
    start: number;
    end: number;
    text: string;
}

interface SummaryResult {
    summary: string;
    actionItems: string[];
    keyPoints: string[];
    decisions: string[];
}

type RecordingStatus = 'idle' | 'recording' | 'paused' | 'loading-model' | 'transcribing' | 'summarizing';

function App() {
    const [status, setStatus] = useState<RecordingStatus>('idle');
    const [duration, setDuration] = useState(0);
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
    const [transcriptText, setTranscriptText] = useState('');
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [summary, setSummary] = useState<SummaryResult | null>(null);
    const [activeTab, setActiveTab] = useState<'record' | 'history' | 'settings'>('record');
    const [error, setError] = useState<string>('');
    const [currentMeetingId, setCurrentMeetingId] = useState<number | null>(null);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [whisperModel, setWhisperModel] = useState<'tiny' | 'base' | 'small'>('tiny');
    const [modelLoaded, setModelLoaded] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        loadMeetings();
    }, []);

    const loadMeetings = async () => {
        try {
            const result = await window.electronAPI.getMeetings();
            if (result.success && result.meetings) {
                setMeetings(result.meetings);
            }
        } catch (err) {
            console.error('Failed to load meetings:', err);
        }
    };

    const handleProgress = (progress: TranscriptionProgress) => {
        setProgressMessage(progress.message);
        setProgressPercent(progress.progress);
    };

    const loadWhisperModel = async () => {
        if (browserWhisperService.isReady()) {
            setModelLoaded(true);
            return true;
        }
        setStatus('loading-model');
        const success = await browserWhisperService.initialize(whisperModel, handleProgress);
        setModelLoaded(success);
        if (!success) {
            setError('Failed to load Whisper model');
        }
        return success;
    };

    const formatDuration = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const startRecording = useCallback(async () => {
        try {
            setError('');
            setProgressMessage('Preparing to record...');

            if (!browserWhisperService.isReady()) {
                const loaded = await loadWhisperModel();
                if (!loaded) return;
            }

            await window.electronAPI.checkMicrophonePermission();

            const meeting = await window.electronAPI.createMeeting({
                title: `Meeting ${new Date().toLocaleDateString()}`,
                date: new Date().toISOString(),
                duration: 0,
                audioPath: '',
                status: 'recording',
            });

            if (meeting.success && meeting.meeting) {
                setCurrentMeetingId(meeting.meeting.id);
            }

            let systemStream: MediaStream | null = null;
            try {
                setProgressMessage('Select meeting window to capture audio...');
                systemStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                    }
                } as any);
                systemStream.getVideoTracks().forEach(track => track.stop());
            } catch (displayErr) {
                console.log('System audio not available:', displayErr);
            }

            let micStream: MediaStream | null = null;
            try {
                micStream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true },
                    video: false
                });
            } catch (micErr) {
                console.log('Microphone not available:', micErr);
            }

            const audioContext = new AudioContext();
            const destination = audioContext.createMediaStreamDestination();

            if (systemStream && systemStream.getAudioTracks().length > 0) {
                const systemSource = audioContext.createMediaStreamSource(systemStream);
                systemSource.connect(destination);
            }

            if (micStream && micStream.getAudioTracks().length > 0) {
                const micSource = audioContext.createMediaStreamSource(micStream);
                micSource.connect(destination);
            }

            if (destination.stream.getAudioTracks().length === 0) {
                setError('No audio sources available. Please allow access.');
                return;
            }

            const combinedStream = destination.stream;
            streamRef.current = combinedStream;
            (streamRef as any).systemStream = systemStream;
            (streamRef as any).micStream = micStream;
            (streamRef as any).audioContext = audioContext;

            const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'audio/webm;codecs=opus' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            setProgressMessage('');

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                await processRecording();
            };

            mediaRecorder.start(1000);
            setStatus('recording');
            setDuration(0);
            setTranscript([]);
            setTranscriptText('');
            setSummary(null);

            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);

        } catch (err) {
            console.error('Failed to start recording:', err);
            setError('Failed to start recording: ' + String(err));
            setStatus('idle');
        }
    }, [whisperModel]);

    const processRecording = async () => {
        setStatus('transcribing');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        try {
            const result = await browserWhisperService.transcribe(audioBlob, handleProgress);
            setTranscript(result.segments);
            setTranscriptText(result.text);

            const arrayBuffer = await audioBlob.arrayBuffer();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `meeting-${timestamp}.webm`;
            const saveResult = await window.electronAPI.saveRecording(arrayBuffer, filename);

            if (currentMeetingId) {
                await window.electronAPI.updateMeeting(currentMeetingId, {
                    audioPath: saveResult.path,
                    duration: duration,
                    status: 'summarizing',
                });
                await window.electronAPI.saveMeetingTranscript(currentMeetingId, result);
            }

            await generateSummary(result.text);
        } catch (err) {
            console.error('Transcription error:', err);
            setError('Transcription failed: ' + String(err));
            setStatus('idle');
        }
    };

    const generateSummary = async (text: string) => {
        setStatus('summarizing');
        setProgressMessage('Generating summary...');

        try {
            const result = await browserSummaryService.summarize(text);
            setSummary(result);

            if (currentMeetingId) {
                await window.electronAPI.saveMeetingSummary(currentMeetingId, result, 'local-extractive');
                await window.electronAPI.updateMeeting(currentMeetingId, { status: 'complete' });
            }

            await loadMeetings();
        } catch (err) {
            console.error('Summarization error:', err);
            setError('Summarization failed: ' + String(err));
        }

        setStatus('idle');
        setCurrentMeetingId(null);
        setProgressMessage('');
    };

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && (status === 'recording' || status === 'paused')) {
            mediaRecorderRef.current.stop();
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if ((streamRef as any).systemStream) {
                (streamRef as any).systemStream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
            }
            if ((streamRef as any).micStream) {
                (streamRef as any).micStream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
            }
            if ((streamRef as any).audioContext) {
                (streamRef as any).audioContext.close();
            }
            streamRef.current = null;
        }
    }, [status]);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && status === 'recording') {
            mediaRecorderRef.current.pause();
            setStatus('paused');
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [status]);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && status === 'paused') {
            mediaRecorderRef.current.resume();
            setStatus('recording');
            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        }
    }, [status]);

    const viewMeetingDetails = async (meetingId: number) => {
        try {
            const details = await window.electronAPI.getMeetingDetails(meetingId);
            if (details.success) {
                if (details.transcript) {
                    setTranscriptText(details.transcript.text);
                    setTranscript(JSON.parse(details.transcript.segments || '[]'));
                }
                if (details.summary) {
                    setSummary({
                        summary: details.summary.summary,
                        actionItems: JSON.parse(details.summary.actionItems || '[]'),
                        keyPoints: JSON.parse(details.summary.keyPoints || '[]'),
                        decisions: JSON.parse(details.summary.decisions || '[]'),
                    });
                }
                setActiveTab('record');
            }
        } catch (err) {
            console.error('Failed to load meeting details:', err);
        }
    };

    const deleteMeeting = async (meetingId: number) => {
        try {
            await window.electronAPI.deleteMeeting(meetingId);
            await loadMeetings();
        } catch (err) {
            console.error('Failed to delete meeting:', err);
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'recording': return 'Recording';
            case 'paused': return 'Paused';
            case 'loading-model': return 'Loading AI';
            case 'transcribing': return 'Transcribing';
            case 'summarizing': return 'Summarizing';
            default: return 'Ready';
        }
    };

    const isProcessing = ['loading-model', 'transcribing', 'summarizing'].includes(status);

    return (
        <div className="app">
            <nav className="sidebar">
                <div className="logo">
                    <div className="logo-icon">
                        <Mic size={24} />
                    </div>
                    <span className="logo-text">MeetNotes</span>
                </div>

                <div className="nav-items">
                    <button className={`nav-item ${activeTab === 'record' ? 'active' : ''}`} onClick={() => setActiveTab('record')}>
                        <Mic size={20} />
                        <span>Record</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                        <History size={20} />
                        <span>History</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                        <Settings size={20} />
                        <span>Settings</span>
                    </button>
                </div>

                <div className="sidebar-footer">
                    <div className="status-indicator">
                        <span className={`status-dot ${status}`}></span>
                        <span>{getStatusText()}</span>
                    </div>
                </div>
            </nav>

            <main className="main-content">
                {activeTab === 'record' && (
                    <div className="record-view">
                        <header className="view-header">
                            <div className="header-content">
                                <h1>Meeting Recorder</h1>
                                <p>AI-powered transcription & summarization</p>
                            </div>
                            <div className="header-badges">
                                <span className="badge free"><Zap size={14} /> Free</span>
                                <span className="badge offline"><WifiOff size={14} /> Offline</span>
                                <span className="badge private"><Shield size={14} /> Private</span>
                            </div>
                        </header>

                        {error && (
                            <div className="alert error">
                                <AlertCircle size={20} />
                                <p>{error}</p>
                                <button onClick={() => setError('')}>&times;</button>
                            </div>
                        )}

                        <div className="recording-panel">
                            <div className="timer-display">
                                <Clock size={32} className="timer-icon" />
                                <span className={`timer ${status === 'recording' ? 'recording' : ''}`}>
                                    {formatDuration(duration)}
                                </span>
                            </div>

                            <div className="controls">
                                {status === 'idle' && (
                                    <button className="control-btn primary" onClick={startRecording}>
                                        <Mic size={24} />
                                        <span>Start Recording</span>
                                    </button>
                                )}

                                {status === 'recording' && (
                                    <>
                                        <button className="control-btn secondary" onClick={pauseRecording}>
                                            <Pause size={24} />
                                            <span>Pause</span>
                                        </button>
                                        <button className="control-btn danger" onClick={stopRecording}>
                                            <Square size={24} />
                                            <span>Stop</span>
                                        </button>
                                    </>
                                )}

                                {status === 'paused' && (
                                    <>
                                        <button className="control-btn success" onClick={resumeRecording}>
                                            <Play size={24} />
                                            <span>Resume</span>
                                        </button>
                                        <button className="control-btn danger" onClick={stopRecording}>
                                            <Square size={24} />
                                            <span>Stop</span>
                                        </button>
                                    </>
                                )}

                                {isProcessing && (
                                    <div className="processing-state">
                                        <Loader2 size={32} className="spinner" />
                                        <div className="progress-info">
                                            <span>{progressMessage || getStatusText()}</span>
                                            {progressPercent > 0 && (
                                                <div className="progress-bar">
                                                    <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {status === 'recording' && (
                                <div className="recording-indicator">
                                    <div className="pulse-ring"></div>
                                    <Volume2 size={20} />
                                    <span>Capturing audio...</span>
                                </div>
                            )}
                        </div>

                        {(transcript.length > 0 || transcriptText) && (
                            <div className="panel transcript-panel">
                                <div className="panel-header">
                                    <FileText size={20} />
                                    <h2>Transcript</h2>
                                </div>
                                <div className="panel-content">
                                    {transcript.length > 0 ? (
                                        transcript.map((segment, i) => (
                                            <div key={i} className="transcript-segment">
                                                <span className="timestamp">{formatDuration(Math.floor(segment.start))}</span>
                                                <span className="text">{segment.text}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p>{transcriptText}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {summary && (
                            <div className="panel summary-panel">
                                <div className="panel-header">
                                    <Sparkles size={20} />
                                    <h2>AI Summary</h2>
                                </div>
                                <div className="summary-content">
                                    <div className="summary-section">
                                        <p className="summary-text">{summary.summary}</p>
                                    </div>

                                    {summary.keyPoints.length > 0 && (
                                        <div className="summary-section">
                                            <h3><Target size={16} /> Key Points</h3>
                                            <ul>
                                                {summary.keyPoints.map((point, i) => (
                                                    <li key={i}>{point}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {summary.actionItems.length > 0 && (
                                        <div className="summary-section">
                                            <h3><ListChecks size={16} /> Action Items</h3>
                                            <ul>
                                                {summary.actionItems.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {summary.decisions.length > 0 && (
                                        <div className="summary-section">
                                            <h3><GitBranch size={16} /> Decisions</h3>
                                            <ul>
                                                {summary.decisions.map((decision, i) => (
                                                    <li key={i}>{decision}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="history-view">
                        <header className="view-header">
                            <h1>Meeting History</h1>
                            <p>Your recorded meetings and transcripts</p>
                        </header>

                        <div className="meetings-list">
                            {meetings.length === 0 ? (
                                <div className="empty-state">
                                    <History size={64} />
                                    <h3>No meetings yet</h3>
                                    <p>Your recorded meetings will appear here</p>
                                </div>
                            ) : (
                                meetings.map((meeting) => (
                                    <div key={meeting.id} className="meeting-card">
                                        <div className="meeting-icon">
                                            <Mic size={24} />
                                        </div>
                                        <div className="meeting-info">
                                            <h3>{meeting.title}</h3>
                                            <div className="meeting-meta">
                                                <span><Clock size={14} /> {formatDuration(meeting.duration)}</span>
                                                <span>{formatDate(meeting.createdAt)}</span>
                                                <span className={`status-tag ${meeting.status}`}>
                                                    {meeting.status === 'complete' ? <CheckCircle2 size={14} /> : <Loader2 size={14} />}
                                                    {meeting.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="meeting-actions">
                                            <button className="icon-btn" title="View" onClick={() => viewMeetingDetails(meeting.id)}>
                                                <Eye size={18} />
                                            </button>
                                            <button className="icon-btn danger" title="Delete" onClick={() => deleteMeeting(meeting.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="settings-view">
                        <header className="view-header">
                            <h1>Settings</h1>
                            <p>Configure AI model and preferences</p>
                        </header>

                        <div className="settings-grid">
                            <div className="settings-card highlight">
                                <div className="card-header">
                                    <Sparkles size={24} />
                                    <div>
                                        <h3>100% Free AI</h3>
                                        <p>All processing runs locally on your device</p>
                                    </div>
                                </div>
                                <div className="features-row">
                                    <div className="feature">
                                        <Zap size={20} />
                                        <span>$0 Cost</span>
                                    </div>
                                    <div className="feature">
                                        <Shield size={20} />
                                        <span>Private</span>
                                    </div>
                                    <div className="feature">
                                        <WifiOff size={20} />
                                        <span>Offline</span>
                                    </div>
                                </div>
                            </div>

                            <div className="settings-card">
                                <div className="card-header">
                                    <Volume2 size={24} />
                                    <div>
                                        <h3>Whisper Model</h3>
                                        <p>Choose transcription accuracy vs speed</p>
                                    </div>
                                </div>
                                <div className="model-options">
                                    {[
                                        { id: 'tiny', name: 'Tiny', size: '~75MB', desc: 'Fastest' },
                                        { id: 'base', name: 'Base', size: '~145MB', desc: 'Balanced' },
                                        { id: 'small', name: 'Small', size: '~465MB', desc: 'Accurate' },
                                    ].map(model => (
                                        <label key={model.id} className={`model-option ${whisperModel === model.id ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name="model"
                                                checked={whisperModel === model.id}
                                                onChange={() => setWhisperModel(model.id as any)}
                                            />
                                            <div className="option-content">
                                                <strong>{model.name}</strong>
                                                <span>{model.size} • {model.desc}</span>
                                            </div>
                                            {whisperModel === model.id && <CheckCircle2 size={20} />}
                                        </label>
                                    ))}
                                </div>
                                {modelLoaded && (
                                    <div className="model-status success">
                                        <CheckCircle2 size={16} /> Model loaded and ready
                                    </div>
                                )}
                            </div>

                            <div className="settings-card">
                                <div className="card-header">
                                    <Monitor size={24} />
                                    <div>
                                        <h3>Audio Capture</h3>
                                        <p>How meeting recording works</p>
                                    </div>
                                </div>
                                <div className="info-list">
                                    <div className="info-item">
                                        <ChevronRight size={16} />
                                        <span>Select meeting window when starting</span>
                                    </div>
                                    <div className="info-item">
                                        <ChevronRight size={16} />
                                        <span>Enable "Share audio" option</span>
                                    </div>
                                    <div className="info-item">
                                        <ChevronRight size={16} />
                                        <span>Captures both you and other participants</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
