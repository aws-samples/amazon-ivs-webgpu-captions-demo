// From https://codepen.io/amazon-ivs/project/editor/ZzWobn
// From https://gitlab.aws.dev/ivs-demos/amazon-ivs-real-time-tool/-/blob/main/src/contexts/DeviceManager/helpers/helpers.ts

import toast from 'react-hot-toast';

const videoConfiguration = {
  idealWidth: 1280,
  idealHeight: 720,
  idealFramerate: 30,
  idealAspect: 16 / 9,
  idealFacingMode: 'user',
};

const { permissions, mediaDevices } = navigator;

function checkMediaDevicesSupport() {
  if (!mediaDevices) {
    throw new Error(
      'Media device permissions can only be requested in a secure context (i.e. HTTPS).'
    );
  }
}

function isFulfilled(input) {
  return input.status === 'fulfilled';
}

function isRejected(input) {
  return input.status === 'rejected';
}

async function enumerateDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter((d) => d.kind === 'videoinput');
  if (!videoDevices.length) {
    toast.error('Error: Could not find any webcams.', {
      id: 'err-could-not-list-video-devices',
      duration: Infinity,
    });
  }

  const audioDevices = devices.filter((d) => d.kind === 'audioinput');
  if (!audioDevices.length) {
    toast.error('Error: Could not find any microphones.', {
      id: 'err-could-not-list-audio-devices',
      duration: Infinity,
    });
  }

  return {
    videoDevices,
    audioDevices,
  };
}

async function getPermissions({ savedAudioDeviceId, savedVideoDeviceId }) {
  let error;
  let mediaStream;
  let arePermissionsGranted = false;

  try {
    checkMediaDevicesSupport();

    const [cameraPermissionQueryResult, microphonePermissionQueryResult] =
      await Promise.allSettled(
        ['camera', 'microphone'].map((permissionDescriptorName) =>
          permissions.query({
            name: permissionDescriptorName,
          })
        )
      );

    const constraints = {};

    if (
      (isFulfilled(cameraPermissionQueryResult) &&
        cameraPermissionQueryResult.value.state !== 'granted') ||
      isRejected(cameraPermissionQueryResult)
    ) {
      constraints.video = {
        deviceId: { ideal: savedVideoDeviceId },
      };
    }

    if (
      (isFulfilled(microphonePermissionQueryResult) &&
        microphonePermissionQueryResult.value.state !== 'granted') ||
      isRejected(microphonePermissionQueryResult)
    ) {
      constraints.audio = {
        deviceId: { ideal: savedAudioDeviceId },
      };
    }

    if (Object.keys(constraints).length) {
      mediaStream = await mediaDevices.getUserMedia(constraints);
    }

    arePermissionsGranted = true;
  } catch (err) {
    error = new Error(err.name);
  }
  return { permissions: arePermissionsGranted, mediaStream, error };
}

async function getAvailableDevices({ savedAudioDeviceId, savedVideoDeviceId }) {
  // The following line prevents issues on Safari/FF WRT to device selects
  // and ensures the device labels are not blank
  const { permissions, mediaStream, error } = await getPermissions({
    savedAudioDeviceId,
    savedVideoDeviceId,
  });

  if (!permissions || error) {
    toast.error(
      'Error: Could not access webcams or microphones. Allow this app to access your webcams and microphones and refresh the app.',
      {
        id: 'err-permission-denied',
        duration: Infinity,
      }
    );
  }

  const { videoDevices, audioDevices } = await enumerateDevices();

  // After enumerating devices, the initial mediaStream must be stopped
  if (mediaStream) await stopMediaStream(mediaStream);

  return {
    videoDevices,
    audioDevices,
    permissions,
  };
}

async function stopMediaStream(mediaStream) {
  for (const track of mediaStream.getTracks()) {
    track.stop();
  }
}

async function getCameraTrack(deviceId) {
  let cameraTrack = {};
  try {
    const media = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: deviceId ? { exact: deviceId } : null,
        width: {
          ideal: videoConfiguration.idealWidth,
        },
        height: {
          ideal: videoConfiguration.idealHeight,
        },
        facingMode: { ideal: videoConfiguration.idealFacingMode },
        frameRate: { ideal: videoConfiguration.idealFramerate },
        aspectRatio: { ideal: videoConfiguration.idealAspect },
      },
      audio: false,
    });
    cameraTrack = media.getTracks()[0];
  } catch (err) {
    console.error('Could not get camera track:', err.message);
  }
  return cameraTrack;
}

async function getMicrophoneTrack(deviceId) {
  let microphoneTrack = {};
  try {
    const media = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: deviceId ? { exact: deviceId } : null,
    });
    microphoneTrack = media.getTracks()[0];
  } catch (err) {
    console.error('Could not get microphone track:', err.message);
  }
  return microphoneTrack;
}

export {
  getAvailableDevices,
  getCameraTrack,
  getMicrophoneTrack,
  stopMediaStream,
};
