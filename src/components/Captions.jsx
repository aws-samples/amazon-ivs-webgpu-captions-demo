import { AnimatePresence, motion } from 'framer-motion';
import {
  scaleMotionTransitions,
  scaleMotionVariants,
} from '../helpers/animation';
import { useEffect, useState } from 'react';

const getLastWords = (str, n = 20) => {
  // Split the string into an array of words, preserving punctuation
  const words = str.match(/\S+/g) || [];

  // Get the last 20 words (or all words if less than 20)
  const lastTwenty = words.slice(n * -1);

  // Join the words back into a string and return
  return lastTwenty.join(' ');
};

function getNewString(oldString, newString) {
  const prevTranscription = oldString.split(' ');
  const lastWordOfPrevTranscription =
    prevTranscription[prevTranscription.length - 1];

  if (newString.includes(lastWordOfPrevTranscription)) {
    prevTranscription.pop();
  }
  let result = [prevTranscription.join(' '), newString].join(' ');
  result = getLastWords(result, 120);
  return result;
}

function makeLines(string = '', maxLength = 40) {
  const result = [];
  let currentSubstring = '';

  for (const word of string.split(' ')) {
    if ((currentSubstring + ' ' + word).length <= maxLength) {
      currentSubstring += (currentSubstring ? ' ' : '') + word;
    } else {
      if (currentSubstring) {
        result.push(currentSubstring);
      }
      currentSubstring = word;
    }
  }

  if (currentSubstring) result.push(currentSubstring);

  return result;
}

function getNewLines(prevLines, newWords, maxLength, maxLines = 3) {
  let _lines = prevLines;
  const lastLine = _lines[_lines.length - 1];
  const prevString = lastLine.string || '';
  const newString = getNewString(prevString, newWords);

  // console.log('new string', newString);

  // Append the new words to create one or more lines
  const newLines = makeLines(newString, maxLength);

  _lines[_lines.length - 1] = {
    key: lastLine.key || Date.now(),
    string: newLines[0],
  };

  if (newLines.length == 2) {
    _lines.push({
      key: Date.now(),
      string: newLines[1],
    });
  }

  _lines = _lines.slice(-1 * maxLines);

  return _lines;
}

export function Captions({ newCaptions = '' }) {
  const [lines, setLines] = useState(['']);

  useEffect(() => {
    setLines((prevState) => getNewLines(prevState, newCaptions, 40));
  }, [newCaptions]);

  return (
    <>
      <motion.div
        className='relative'
        key='caption'
        initial='hidden'
        animate='visible'
        exit='hidden'
        variants={scaleMotionVariants}
        transition={scaleMotionTransitions}
      >
        <div className='relative w-full h-full'>
          <AnimatePresence>
            {lines.map((line) => (
              <motion.div
                layout
                className='block'
                key={line.key || 0}
                initial={{ y: 28 }}
                animate={{ y: 0 }}
                exit={{ y: -28 }}
                transition={{
                  ease: 'linear',
                  duration: 0.15,
                }}
              >
                <span className='inline-block px-1 bg-black/90 text-white text-lg font-mono whitespace-pre-wrap pointer-events-auto'>
                  {line.string || ''}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

export default Captions;
