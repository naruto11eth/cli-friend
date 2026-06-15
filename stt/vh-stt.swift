// vh-stt — tiny on-device speech-to-text helper for Vim Helper.
//
// Captures the microphone, transcribes with SFSpeechRecognizer (on-device when
// supported), prints the final transcript to stdout, and exits. Stops on ~1.6s
// of trailing silence or after a 10s hard cap. Errors go to stderr + exit(1).
//
// Build (see scripts/build-stt.sh):
//   swiftc -O vh-stt.swift -o vim-helper-stt-<triple> \
//     -framework Speech -framework AVFoundation \
//     -Xlinker -sectcreate -Xlinker __TEXT -Xlinker __info_plist -Xlinker Info.plist

import AVFoundation
import Foundation
import Speech

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data((message + "\n").utf8))
    exit(1)
}

let engine = AVAudioEngine()
let request = SFSpeechAudioBufferRecognitionRequest()
request.shouldReportPartialResults = true

var transcript = ""
var task: SFSpeechRecognitionTask?
var done = false
var silenceTimer: DispatchWorkItem?

guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US")) else {
    fail("speech recognizer unavailable")
}

func finish() {
    if done { return }
    done = true
    silenceTimer?.cancel()
    engine.stop()
    engine.inputNode.removeTap(onBus: 0)
    task?.finish()
    print(transcript)
    // Give stdout a beat to flush, then exit.
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { exit(0) }
}

// Reset the "stop after silence" countdown each time we get fresh speech.
func resetSilence() {
    silenceTimer?.cancel()
    let work = DispatchWorkItem {
        request.endAudio()
        // Let the recognizer emit its final result, then finish.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { finish() }
    }
    silenceTimer = work
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.6, execute: work)
}

func startListening() {
    if recognizer.supportsOnDeviceRecognition {
        request.requiresOnDeviceRecognition = true
    }

    let input = engine.inputNode
    let format = input.outputFormat(forBus: 0)
    input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
        request.append(buffer)
    }
    engine.prepare()
    do {
        try engine.start()
    } catch {
        fail("audio engine failed to start: \(error.localizedDescription)")
    }

    task = recognizer.recognitionTask(with: request) { result, error in
        if let result = result {
            transcript = result.bestTranscription.formattedString
            resetSilence()
            if result.isFinal { finish() }
        }
        if error != nil { finish() }
    }

    // Hard cap so we never hang forever.
    DispatchQueue.main.asyncAfter(deadline: .now() + 10.0) { finish() }
    resetSilence()
}

// Ask for speech + microphone permission, then start.
SFSpeechRecognizer.requestAuthorization { speechStatus in
    guard speechStatus == .authorized else {
        fail("speech recognition not authorized")
    }
    AVCaptureDevice.requestAccess(for: .audio) { micGranted in
        guard micGranted else { fail("microphone access denied") }
        DispatchQueue.main.async { startListening() }
    }
}

dispatchMain()
