"use client";

import { useEffect, useRef, useState } from "react";

export function useAudioRecorder(
    onRecordingComplete: (blob: Blob) => void,
    onRecordingRemoved: () => void,
    onRecordingStateChange: (isRecording: boolean) => void
) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingError, setRecordingError] = useState<string | null>(null);
    const recordingStartTimeRef = useRef<number | null>(null);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [recordingDuration, setRecordingDuration] = useState<number>(0);

    // Cleanup media recorder and object URLs on unmount
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetRecordingState = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
        }
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
        recordingStartTimeRef.current = null;
        onRecordingStateChange(false);
        setRecordingDuration(0);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setAudioBlob(null);
        onRecordingRemoved();
    };

    const getSupportedMimeType = () => {
        const types = [
            "audio/webm;codecs=opus", // Chrome/Firefox (High compression)
            "audio/mp4",              // Safari (AAC - Good compression)
            "audio/ogg;codecs=opus",  // Firefox
            "audio/webm",             // Fallback
            "audio/ogg"               // Fallback
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return ""; // Let browser choose default if none match
    };

    const startRecording = async () => {
        try {
            setRecordingError(null);

            // Stop any existing recording state
            resetRecordingState();

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setRecordingError("Audio recording is not supported in this browser.");
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });
            mediaStreamRef.current = stream;

            const mimeType = getSupportedMimeType();

            const options: MediaRecorderOptions = {
                audioBitsPerSecond: 64000,
            };
            if (mimeType) {
                options.mimeType = mimeType;
            }

            try {
                const mediaRecorder = new MediaRecorder(stream, options);
                mediaRecorderRef.current = mediaRecorder;

                const chunks: BlobPart[] = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data && event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    const type = mimeType || mediaRecorder.mimeType || "audio/webm";
                    let blob = new Blob(chunks, { type });

                    if (type.includes("webm") && recordingStartTimeRef.current) {
                        const duration = Date.now() - recordingStartTimeRef.current;
                        const { default: fixWebmDuration } = await import("fix-webm-duration");
                        blob = await fixWebmDuration(blob, duration, { logger: false });
                    }

                    if (audioUrl) {
                        URL.revokeObjectURL(audioUrl);
                    }
                    const url = URL.createObjectURL(blob);
                    setAudioBlob(blob);
                    setAudioUrl(url);
                    onRecordingComplete(blob);
                    onRecordingStateChange(false);
                    if (recordingTimerRef.current) {
                        clearInterval(recordingTimerRef.current);
                        recordingTimerRef.current = null;
                    }
                };

                mediaRecorder.onerror = (event: any) => {
                    console.error("MediaRecorder error:", event.error);
                    setRecordingError("An error occurred during recording.");
                    stopRecording();
                };

                mediaRecorder.start(1000);
                onRecordingStateChange(true);
                recordingStartTimeRef.current = Date.now();
                setRecordingDuration(0);

                recordingTimerRef.current = setInterval(() => {
                    if (recordingStartTimeRef.current) {
                        const diff = Date.now() - recordingStartTimeRef.current;
                        setRecordingDuration(Math.floor(diff / 1000));
                    }
                }, 1000);
            } catch (err) {
                console.error("Error creating MediaRecorder:", err);
                setRecordingError("Failed to create media recorder. Your browser might not support this format.");
                resetRecordingState();
            }

        } catch (error) {
            console.error("Error starting audio recording:", error);
            setRecordingError(
                error instanceof Error
                    ? error.message
                    : "Failed to start audio recording. Please check microphone permissions."
            );
            resetRecordingState();
        }
    };

    const stopRecording = () => {
        try {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.requestData();
                mediaRecorderRef.current.stop();
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((track) => track.stop());
                mediaStreamRef.current = null;
            }
        } catch (error) {
            console.error("Error stopping audio recording:", error);
        } finally {
            onRecordingStateChange(false);
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
        }
    };

    return {
        audioUrl,
        audioBlob,
        recordingError,
        recordingDuration,
        startRecording,
        stopRecording,
        resetRecordingState,
    };
}
