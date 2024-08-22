import LowLatency from '../components/LowLatency';
import CaptionsProvider from '../contexts/CaptionsContext';
import ModalProvider from '../contexts/ModalContext';

export default function LowLatencyPage() {
  return (
    <ModalProvider>
      <CaptionsProvider>
        <LowLatency />
      </CaptionsProvider>
    </ModalProvider>
  );
}
