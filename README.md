# Video Recorder Extension

Simple Google Chrome extension that records a video stream from a web page and downloads it locally. It buffers the video in memory, so it is not suitable for recording long streams. The longest video I've recorded with this extension was about 10 minutes long, and the resulting file was ~80Mb.

## Installation

1. Clone this repository
2. Navigate to `chrome://extensions` in Google Chrome
3. Enable "Developer mode" if not enabled already
4. Click "Load unpacked" button
5. Choose the folder with this extension

## Usage

Click the extension icon on any webpage with a video element. Recording will start when the video starts playing. If the video is already playing, recording will start as soon as you click the extension icon. Recording will stop when the video ends or when you click the extension icon again. Once the recording stops, the video recorded so far will be downloaded automatically. The format of the video is `webm`.
