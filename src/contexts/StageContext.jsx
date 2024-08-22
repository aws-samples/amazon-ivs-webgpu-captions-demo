// From https://codepen.io/amazon-ivs/project/editor/ZzWobn

import { createContext, useMemo } from 'react';
import useStage from '../hooks/useStage';
import { API_URL } from '../constants';

const StageContext = createContext({
  joinStage: undefined,
  participants: [],
  stageJoined: false,
  leaveStage: undefined,
  getSdkVersion: undefined,
  getStageToken: undefined,
});

// eslint-disable-next-line react/prop-types
function StageProvider({ children }) {
  const { joinStage, stageJoined, leaveStage, participants, getSdkVersion } =
    useStage();

  const getStageToken = async (publish = false) => {
    const body = JSON.stringify({ userId: '', publish });
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    const result = await fetch(`${API_URL}/join`, {
      method: 'POST',
      headers,
      body,
    });
    return result;
  };

  const state = useMemo(() => {
    return {
      joinStage,
      stageJoined,
      leaveStage,
      participants,
      getSdkVersion,
      getStageToken,
    };
  }, [joinStage, leaveStage, participants, stageJoined, getSdkVersion]);

  return (
    <StageContext.Provider value={state}>{children}</StageContext.Provider>
  );
}

export { StageContext };
export default StageProvider;
