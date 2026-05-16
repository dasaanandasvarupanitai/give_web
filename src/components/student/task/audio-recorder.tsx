"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Mic, Square, X } from "lucide-react";
import { useEffect } from "react";
import { useAudioRecorder } from "./hooks/use-audio-recorder";

interface AudioRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
    onRecordingRemoved: () => void;
    isRecordingActive: boolean;
    onRecordingStateChange: (isRecording: boolean) => void;
    disabled: boolean;
    activeSubmissionType: 'text' | 'audio' | 'file' | null;
    taskType: string;
}

export function AudioRecorder({
    onRecordingComplete,
    onRecordingRemoved,
    isRecordingActive,
    onRecordingStateChange,
    disabled,
    activeSubmissionType,
    taskType
}: AudioRecorderProps) {
    const {
        audioUrl,
        audioBlob,
        recordingError,
        recordingDuration,
        startRecording,
        stopRecording,
        resetRecordingState,
    } = useAudioRecorder(onRecordingComplete, onRecordingRemoved, onRecordingStateChange);

    useEffect(() => {
        if (taskType === "dailyListening" && (activeSubmissionType === 'text' || activeSubmissionType === 'file')) {
            // Internal cleanup if submission type changes
        }
    }, [activeSubmissionType, taskType]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Audio Recording (Optional)</CardTitle>
                <CardDescription>
                    Record your daily listening reflection using your microphone. Works best in Chrome or modern browsers.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {recordingError && (
                    <p className="text-sm text-red-600">{recordingError}</p>
                )}

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant={isRecordingActive ? "destructive" : "outline"}
                        className="border border-orange-500"
                        onClick={isRecordingActive ? stopRecording : startRecording}
                        disabled={
                            disabled ||
                            (taskType === "dailyListening" && activeSubmissionType === 'text') ||
                            (taskType === "dailyListening" && activeSubmissionType === 'file')
                        }
                    >
                        {isRecordingActive ? (
                            <>
                                <Square className="h-4 w-4 mr-2" />
                                Stop Recording
                            </>
                        ) : (
                            <>
                                <Mic className="h-4 w-4 mr-2" />
                                Start Recording
                            </>
                        )}
                    </Button>

                    <div className="text-sm text-muted-foreground">
                        {isRecordingActive
                            ? `Recording... ${recordingDuration}s`
                            : audioBlob
                                ? "Recorded audio ready to submit."
                                : (taskType === "dailyListening" && (activeSubmissionType === 'text' || activeSubmissionType === 'file'))
                                    ? "Audio recording is disabled because another submission type is active."
                                    : "No recording yet."}
                    </div>
                </div>

                {audioUrl && (
                    <div className="space-y-2">
                        <audio controls src={audioUrl} className="w-full">
                            Your browser does not support the audio element.
                        </audio>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="border border-orange-500"
                            onClick={resetRecordingState}
                            disabled={isRecordingActive || disabled}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Remove Recording
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
