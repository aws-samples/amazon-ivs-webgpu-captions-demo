async function copyTextToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

export default copyTextToClipboard;
