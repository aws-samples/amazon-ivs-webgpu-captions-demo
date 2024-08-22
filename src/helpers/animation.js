const scaleMotionVariants = {
  hidden: { opacity: 0, scale: 0.75 },
  visible: { opacity: 1, scale: 1 },
  hovered: { scale: 1.1 },
};
const scaleMotionTransitions = {
  duration: 0.15,
  ease: 'easeInOut',
  staggerChildren: 0.5,
  scale: {
    type: 'spring',
    duration: 0.4,
    restDelta: 0.001,
  },
};

export { scaleMotionVariants, scaleMotionTransitions };
