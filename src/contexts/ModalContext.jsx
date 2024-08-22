import { createContext, useState } from 'react';

const ModalContext = createContext({});

function ModalProvider({ children }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(undefined);

  return (
    <ModalContext.Provider
      value={{ modalOpen, setModalOpen, modalContent, setModalContent }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export default ModalProvider;
export { ModalContext };
