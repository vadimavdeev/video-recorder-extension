const BadgeTexts = {
  NO_VIDEO: "OFF",
  READY: "RDY",
  RECORDING: "REC",
  PAUSED: "PAU",
};

const RECORD_CHUNK_SIZE = 10 * 1000; // 10 seconds

// records the provided video as it is playing;
// pauses recording automatically when playback stops for
// whatever reason (pause, seeking, waiting, suspended);
// stops recording and downloads the file when the video ends,
// or when the returned function is called
function startRecording(video) {
  let recorder = null;
  let data = [];
  let duration = 0;
  let lastStartTime = null;

  video.addEventListener("playing", onVideoPlaying);
  video.addEventListener("pause", onVideoPaused);
  video.addEventListener("waiting", onVideoPaused);
  video.addEventListener("ended", onVideoEnded);
  video.addEventListener("emptied", onVideoEmptied);

  function onVideoEmptied() {
    recorder = null;
    data = [];
    duration = 0;
  }

  function onVideoPlaying() {
    if (!recorder) {
      recorder = new MediaRecorder(video.captureStream());
      recorder.ondataavailable = (event) => {
        data.push(event.data);
      };
      recorder.onstop = onRecordingComplete;
      recorder.start(RECORD_CHUNK_SIZE);
    } else if (recorder.state === "paused") {
      recorder.resume();
    }
    lastStartTime = performance.now();
    updateExtensionBadge(BadgeTexts.RECORDING);
  }

  function onVideoPaused() {
    if (!recorder || recorder.state === "inactive") return;
    recorder.pause();
    updateDuration();
    updateExtensionBadge(BadgeTexts.PAUSED);
  }

  function onVideoEnded() {
    if (!recorder) return;

    recorder.stop();
    updateDuration();
    updateExtensionBadge(BadgeTexts.READY);
  }

  function updateDuration() {
    if (lastStartTime) {
      duration += performance.now() - lastStartTime;
      lastStartTime = null;
    }
  }

  async function onRecordingComplete() {
    let recordedBlob = await ysFixWebmDuration(
      new Blob(data, { type: "video/webm" }),
      duration
    );
    let url = URL.createObjectURL(recordedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getCurrentVideoName();
    document.body.appendChild(a);
    a.click();
  }

  return onVideoEnded;
}

function getCurrentVideoName() {
  const path = new URL(window.location.href).pathname;
  return path.slice(1, -1).replaceAll("/", "_") + ".webm";
}

function updateExtensionBadge(badgeText) {
  chrome.runtime
    .sendMessage({ badgeText })
    .catch((err) =>
      console.log("failed to send message to parent extension", err)
    );
}

(function main() {
  const video = document.querySelector("video");
  if (!video) {
    updateExtensionBadge(BadgeTexts.NO_VIDEO);
    return;
  }

  const stopRecording = startRecording(video);
  updateExtensionBadge(BadgeTexts.READY);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.op === "stop-recording") {
      stopRecording();
    }
  });
})();
