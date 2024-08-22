export const isHostParticipant = (participantInfo) => {
  return participantInfo.attributes.demoParticipantRole === 'publisher';
};
