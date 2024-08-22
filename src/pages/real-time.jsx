import RealTime from '../components/RealTime';
import CaptionsProvider from '../contexts/CaptionsContext';
import ModalProvider from '../contexts/ModalContext';
import StageProvider from '../contexts/StageContext';

export default function RealTimePage() {
  return (
    <ModalProvider>
      <StageProvider>
        <CaptionsProvider>
          <RealTime />
        </CaptionsProvider>
      </StageProvider>
    </ModalProvider>
  );
}
