// From https://codepen.io/amazon-ivs/project/editor/ZzWobn

import { useState, useRef, useCallback } from 'react';
import Strategy from '../sdk/StageStrategy';
import {
  __version,
  Stage,
  StageConnectionState,
  StageEvents,
  StageParticipantPublishState,
  StageParticipantSubscribeState,
} from 'amazon-ivs-web-broadcast';
import toast from 'react-hot-toast';

export default function useStage() {
  const [stageJoined, setStageJoined] = useState(false);
  const [participants, setParticipants] = useState(new Map());

  const stageRef = useRef(undefined);
  const strategyRef = useRef(new Strategy());

  const refreshStageStrategy = useCallback(() => {
    if (stageRef.current && stageJoined) {
      stageRef.current.refreshStrategy();
    }
  }, [stageJoined]);

  const getSdkVersion = useCallback(() => {
    return __version;
  }, []);

  const handleParticipantJoin = useCallback(
    (participantInfo) => {
      if (!isLocalParticipant(participantInfo)) {
        {
          setParticipants((prevState) => {
            const participant = createParticipant(participantInfo);
            // NOTE: we must make a new map so react picks up the state change
            return new Map(prevState.set(participant.id, participant));
          });
        }
        refreshStageStrategy();
      }
    },
    [refreshStageStrategy]
  );

  const handleParticipantLeave = useCallback((participantInfo) => {
    if (!isLocalParticipant(participantInfo)) {
      setParticipants((prevState) => {
        prevState.delete(participantInfo.id);
        return new Map(prevState);
      });
    }
  }, []);

  const handleMediaAdded = useCallback((participantInfo, streams) => {
    if (!isLocalParticipant(participantInfo)) {
      const { id } = participantInfo;
      setParticipants((prevState) => {
        let participant = prevState.get(id);
        participant = {
          ...participant,
          streams: [...streams, ...participant.streams],
        };
        return new Map(prevState.set(id, participant));
      });
    }
  }, []);

  const handleMediaRemoved = useCallback((participantInfo, streams) => {
    if (!isLocalParticipant(participantInfo)) {
      const { id } = participantInfo;
      setParticipants((prevState) => {
        let participant = prevState.get(id);
        const newStreams = participant.streams.filter(
          (existingStream) =>
            !streams.find(
              (removedStream) => existingStream.id === removedStream.id
            )
        );
        participant = { ...participant, streams: newStreams };
        return new Map(prevState.set(id, participant));
      });
    }
  }, []);

  const handleParticipantMuteChange = useCallback((participantInfo) => {
    if (!isLocalParticipant(participantInfo)) {
      const { id } = participantInfo;
      setParticipants((prevState) => {
        let participant = prevState.get(id);
        participant = { ...participant, ...participantInfo };
        return new Map(prevState.set(id, participant));
      });
    }
  }, []);

  const handleConnectionStateChange = useCallback((state) => {
    switch (state) {
      case StageConnectionState.DISCONNECTED:
        setStageJoined(false);
        break;
      case StageConnectionState.CONNECTING:
        setStageJoined(false);
        break;
      case StageConnectionState.CONNECTED:
        setStageJoined(true);
        break;
      case StageConnectionState.ERRORED:
        // Reset stage
        stageRef.current.leave();
        stageRef.current.removeAllListeners();
        // Display error
        toast.error(
          `Error: Could not connect to the session. Refresh the page to try again.`,
          {
            id: 'toast-connection-failed',
            duration: Infinity,
          }
        );
        break;
      default:
        break;
    }
  }, []);

  const handleParticipantPublishStateChange = useCallback(
    (participantInfo, state) => {
      if (state === StageParticipantPublishState.ERRORED) {
        console.error('Error publishing to stage');
        toast.error(`Error: Could not publish to the stage`, {
          id: 'toast-publish-failed',
          duration: Infinity,
        });
      } else {
        toast.dismiss('toast-publish-failed');
      }
    },
    []
  );

  const handleParticipantSubscribeStateChange = useCallback(
    (participantInfo, state) => {
      if (state === StageParticipantSubscribeState.ERRORED) {
        console.error('Error subscribing to stage');
        toast.error(`Error: Could not subscribe to the stage`, {
          id: 'toast-subscribe-failed',
          duration: Infinity,
        });
      } else {
        toast.dismiss('toast-subscribe-failed');
      }
    },
    []
  );

  const leaveStage = useCallback(async () => {
    if (stageRef.current) {
      stageRef.current.leave();
    }
  }, []);

  const createStage = useCallback(
    (token) => {
      if (stageRef.current) return;
      var stage = undefined;
      if (!token) {
        alert('Please enter a token to join a stage');
        return;
      }
      try {
        stage = new Stage(token, strategyRef.current);
        stage.on(
          StageEvents.STAGE_CONNECTION_STATE_CHANGED,
          handleConnectionStateChange
        );
        stage.on(StageEvents.STAGE_PARTICIPANT_JOINED, handleParticipantJoin);
        stage.on(StageEvents.STAGE_PARTICIPANT_LEFT, handleParticipantLeave);
        stage.on(StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED, handleMediaAdded);
        stage.on(
          StageEvents.STAGE_PARTICIPANT_PUBLISH_STATE_CHANGED,
          handleParticipantPublishStateChange
        );
        stage.on(
          StageEvents.STAGE_PARTICIPANT_SUBSCRIBE_STATE_CHANGED,
          handleParticipantSubscribeStateChange
        );
        stage.on(
          StageEvents.STAGE_PARTICIPANT_STREAMS_REMOVED,
          handleMediaRemoved
        );
        stage.on(
          StageEvents.STAGE_STREAM_MUTE_CHANGED,
          handleParticipantMuteChange
        );
      } catch (err) {
        console.error('Error creating stage', err);
        toast.error(`Error creating stage: ${err.message}`, {
          id: 'stage-create-error',
        });
      }
      return stage;
    },
    [
      handleConnectionStateChange,
      handleMediaAdded,
      handleMediaRemoved,
      handleParticipantJoin,
      handleParticipantLeave,
      handleParticipantMuteChange,
      handleParticipantPublishStateChange,
      handleParticipantSubscribeStateChange,
    ]
  );

  const joinStage = useCallback(
    async (token) => {
      try {
        const stage = createStage(token);
        if (!stage) return;
        stageRef.current = stage;
        await stageRef.current.join();
      } catch (err) {
        console.error('Error joining stage', err);
        toast.error(`Error joining stage: ${err.message}`, {
          id: 'stage-join-error',
        });
      }
    },
    [createStage]
  );

  return { joinStage, stageJoined, leaveStage, participants, getSdkVersion };
}

function createParticipant(participantInfo) {
  return {
    ...participantInfo,
    streams: [],
  };
}

function isLocalParticipant(info) {
  return info.isLocal;
}
